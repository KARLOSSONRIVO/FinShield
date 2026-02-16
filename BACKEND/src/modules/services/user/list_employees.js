import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";

export async function listEmployees({ actor }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")

    // Only COMPANY_MANAGER can access this endpoint
    if (actor.role !== "COMPANY_MANAGER") {
        throw new AppError("Forbidden - Only company managers can access employees", 403, "FORBIDDEN")
    }

    // Ensure manager has an organization
    if (!actor.orgId) {
        throw new AppError("Organization not found for user", 400, "ORG_NOT_FOUND")
    }

    // Fetch all users in the manager's organization
    const allOrgUsers = await UsersRepositories.findMany({ orgId: actor.orgId })

    // Filter for COMPANY_USER role only (employees) and exclude the manager themselves
    const employees = allOrgUsers
        .filter(user => 
            user.role === "COMPANY_USER" && 
            String(user._id) !== String(actor.userId)
        )
        .map(toUserPublic)

    return employees
}
