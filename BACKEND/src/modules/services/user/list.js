import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";

export async function listUsers({ actor, orgId }) {
    if (!actor) throw new AppError("Unauthorized", 403, "UNAUTHORIZED")

    let users = [];
    let filter = {};

    if (actor.role === "SUPER_ADMIN") {
        // SUPER_ADMIN can list all users or filter by orgId
        filter = orgId ? { orgId } : {}
        users = await UsersRepositories.findMany(filter)
    } else if (actor.role === "COMPANY_MANAGER") {
        // COMPANY_MANAGER can only list users in their own organization
        if (!actor.orgId) {
            throw new AppError("Organization not found for user", 400, "ORG_NOT_FOUND")
        }
        filter = { orgId: actor.orgId }
        users = await UsersRepositories.findMany(filter)
    } else {
        throw new AppError("Forbidden", 403, "FORBIDDEN")
    }

    // Filter out the current user's own account from the list
    users = users.filter(user => String(user._id) !== String(actor.userId))

    // Map users to public format
    const mappedUsers = users.map(toUserPublic)

    // For COMPANY_MANAGER users in results, add employee list
    const enrichedUsers = await Promise.all(
        mappedUsers.map(async (user) => {
            if (user.role === "COMPANY_MANAGER" && user.orgId) {
                // Get employees (COMPANY_USER role) under this manager in the same org
                const allOrgUsers = await UsersRepositories.findMany({ orgId: user.orgId })
                const employees = allOrgUsers
                    .filter(u => u.role === "COMPANY_USER")
                    .map(emp => ({
                        id: String(emp._id),
                        username: emp.username,
                        status: emp.status
                    }))

                return {
                    ...user,
                    employees
                }
            }
            return user
        })
    )

    return enrichedUsers
}
