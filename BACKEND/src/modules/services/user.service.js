import bcrypt from "bcrypt";
import AppError from "../../common/errors/AppErrors.js";
import * as UsersRepositories from "../repositories/user.repositories.js";
import * as OrganizationRepositories from "../repositories/organization.repositories.js";
import { toUserPublic } from "../mappers/user.mapper.js";

function isPlatformRole(role) {
  return ["SUPER_ADMIN", "AUDITOR", "REGULATOR"].includes(role);
}
function isCompanyRole(role) {
  return ["COMPANY_MANAGER", "COMPANY_USER"].includes(role);
}
function expectedOrgTypeForRole(role) {
  return isPlatformRole(role) ? "platform" : "company";
}

export async function createUser({actor, payload}){
  if(!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  
  let finalOrgId = payload.orgId;
  
  if(actor.role === "SUPER_ADMIN"){
    // SUPER_ADMIN can create any user
  }else if(actor.role === "COMPANY_MANAGER"){
      // COMPANY_MANAGER can only create COMPANY_USER accounts
      if(payload.role !== "COMPANY_USER"){
        throw new AppError("Unauthorized", 403, "FORBIDDEN_ROLE");
      }
      // Automatically use the manager's orgId (ignore any orgId in payload)
      finalOrgId = actor.orgId;
      if (!finalOrgId) {
        throw new AppError("Company manager must belong to an organization", 400, "MISSING_ORG_ID");
      }
  }else{
      throw new AppError("Forbidden",403,"FORBIDDEN")
  }
  
  // SUPER_ADMIN doesn't require orgId, but all other roles do
  if (payload.role !== "SUPER_ADMIN") {
    if (!finalOrgId) {
      throw new AppError("orgId is required for this role", 400, "ORG_ID_REQUIRED");
    }
    
    const org = await OrganizationRepositories.findById(finalOrgId);
    if(!org)throw new AppError("Organization not found",404,"ORGANIZATION_NOT_FOUND");

    const requiredType = expectedOrgTypeForRole(payload.role);
    if(org.type !== requiredType){
      throw new AppError(  `Role ${payload.role} must belong to a ${requiredType} organization`,400,"ROLE_ORG_TYPE_MISMATCH")
    }
  }

  const existing = await UsersRepositories.findByEmail(payload.email);
  if(existing)throw new AppError("User already exists",409,"USER_ALREADY_EXISTS");

  const passwordHash = await bcrypt.hash(payload.password, 10);

  const createUser = await UsersRepositories.create({
    orgId: payload.role === "SUPER_ADMIN" ? null : finalOrgId,
    // portal is derived from role, no longer stored
    role: payload.role,
    email: payload.email,
    username: payload.username,
    passwordHash,
    status: "active",
    mustChangePassword: payload.mustChangePassword ?? true,
    createdByUserId: actor.sub,
  })
  return toUserPublic(createUser);
}

export async function listUsers({ actor, orgId }){
  if(!actor) throw new AppError("Unauthorized",403,"UNAUTHORIZED")

  if(actor.role === "SUPER_ADMIN"){
    const filter = orgId ? {orgId} : {};
    const users = await UsersRepositories.findMany(filter)
    return users.map(toUserPublic) 
  }

  throw new AppError("Forbidden",403,"FORBIDDEN")
}

export async function getUserById({ actor, userId }) {
  if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

  const user = await UsersRepositories.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  // SUPER_ADMIN can access any user, others can only access users in their org
  if (actor.role !== "SUPER_ADMIN") {
    // Handle case where user might not have orgId (shouldn't happen for non-SUPER_ADMIN, but be safe)
    if (!user.orgId || !actor.orgId || String(user.orgId) !== String(actor.orgId)) {
      throw new AppError("Forbidden", 403, "FORBIDDEN");
    }
  }

  return toUserPublic(user);
}


export async function updateUser({ actor, userId, status, reason }) {
  if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  if (actor.role !== "SUPER_ADMIN") throw new AppError("Forbidden", 403, "FORBIDDEN");

  if (status === "disabled" && String(actor.sub) === String(userId)) {
    throw new AppError("You cannot disable your own account", 400, "CANNOT_DISABLE_SELF");
  }

  const user = await UsersRepositories.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const updateData = {
    status,
    updatedAt: new Date(),
  };

  if (status === "disabled") {
    updateData.disabledByUserId = actor.sub;
    updateData.disabledAt = new Date();
    updateData.disableReason = reason;
  } else if (status === "active") {
    updateData.disabledByUserId = null;
    updateData.disabledAt = null;
    updateData.disableReason = null;
  }

  const updated = await UsersRepositories.updateById(userId, updateData);

  return toUserPublic(updated);
}
