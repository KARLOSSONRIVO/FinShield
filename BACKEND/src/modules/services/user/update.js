import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { cacheDel, invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";

export async function updateUser({ actor, userId, status, reason }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    
    // Only SUPER_ADMIN and COMPANY_MANAGER can update users
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "COMPANY_MANAGER") {
        throw new AppError("Forbidden", 403, "FORBIDDEN")
    }

    // Cannot disable own account
    if (status === "disabled" && String(actor.sub) === String(userId)) {
        throw new AppError("You cannot disable your own account", 400, "CANNOT_DISABLE_SELF")
    }

    const user = await UsersRepositories.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND")

    // COMPANY_MANAGER specific restrictions
    if (actor.role === "COMPANY_MANAGER") {
        // Can only update COMPANY_USER (employees)
        if (user.role !== "COMPANY_USER") {
            throw new AppError("Company managers can only update employee accounts", 403, "FORBIDDEN_ROLE")
        }

        // Must be in the same organization
        if (String(user.orgId) !== String(actor.orgId)) {
            throw new AppError("You can only update employees in your organization", 403, "FORBIDDEN_ORG")
        }
    }

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

    const updated = await UsersRepositories.updateById(userId, updateData)

    // Invalidate user caches
    await Promise.all([
        cacheDel(`${CachePrefix.USER}${userId}`),
        invalidatePrefix(CachePrefix.USERS_LIST),
        invalidatePrefix(CachePrefix.USERS_EMP),
    ]);

    return toUserPublic(updated);
}
