import bcrypt from "bcrypt";
import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { isPlatformRole, isCompanyRole, expectedOrgTypeForRole } from "../../../common/utils/role_helpers.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";

export async function createUser({ actor, payload }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")

    let finalOrgId = payload.orgId

    if (actor.role === "SUPER_ADMIN") {
        // SUPER_ADMIN can create any user
    } else if (actor.role === "COMPANY_MANAGER") {
        // COMPANY_MANAGER can only create COMPANY_USER accounts
        if (payload.role !== "COMPANY_USER") {
            throw new AppError("Unauthorized", 403, "FORBIDDEN_ROLE")
        }
        // Automatically use the manager's orgId (ignore any orgId in payload)
        finalOrgId = actor.orgId
        if (!finalOrgId) {
            throw new AppError("Company manager must belong to an organization", 400, "MISSING_ORG_ID")
        }
    } else {
        throw new AppError("Forbidden", 403, "FORBIDDEN")
    }

    // Platform roles (SUPER_ADMIN, AUDITOR, REGULATOR) don't require orgId
    // Company roles (COMPANY_MANAGER, COMPANY_USER) require orgId
    if (isCompanyRole(payload.role)) {
        if (!finalOrgId) {
            throw new AppError("orgId is required for this role", 400, "ORG_ID_REQUIRED")
        }

        const org = await OrganizationRepositories.findById(finalOrgId)
        if (!org) throw new AppError("Organization not found", 404, "ORGANIZATION_NOT_FOUND")

        const requiredType = expectedOrgTypeForRole(payload.role)
        if (org.type !== requiredType) {
            throw new AppError(`Role ${payload.role} must belong to a ${requiredType} organization`, 400, "ROLE_ORG_TYPE_MISMATCH")
        }
    }

    const existing = await UsersRepositories.findByEmail(payload.email);
    if (existing) throw new AppError("User already exists", 409, "USER_ALREADY_EXISTS")

    const passwordHash = await bcrypt.hash(payload.password, 10)

    const createUser = await UsersRepositories.create({
        orgId: isPlatformRole(payload.role) ? null : finalOrgId, // Platform roles don't need orgId
        // portal is derived from role, no longer stored
        role: payload.role,
        email: payload.email,
        username: payload.username,
        passwordHash,
        status: "active",
        mustChangePassword: payload.mustChangePassword ?? true,
        createdByUserId: actor.sub,
    })

    // Invalidate user list caches
    await Promise.all([
        invalidatePrefix(CachePrefix.USERS_LIST),
        invalidatePrefix(CachePrefix.USERS_EMP),
    ]);

    return toUserPublic(createUser)
}
