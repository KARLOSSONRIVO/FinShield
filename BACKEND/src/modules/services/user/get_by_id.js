import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { isPlatformRole } from "../../../common/utils/role_helpers.js";
import { cacheGet, cacheSet } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function getUserById({ actor, userId }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")

    // Try cache first
    const cacheKey = `${CachePrefix.USER}${userId}`;
    const cached = await cacheGet(cacheKey);

    // If cached, still do access control based on the cached data
    if (cached) {
        if (actor.role !== "SUPER_ADMIN" && !isPlatformRole(actor.role)) {
            if (!cached.orgId || !actor.orgId || String(cached.orgId) !== String(actor.orgId)) {
                throw new AppError("Forbidden", 403, "FORBIDDEN")
            }
        }
        return cached;
    }

    const user = await UsersRepositories.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND")

    // SUPER_ADMIN can access any user
    // Platform roles (AUDITOR, REGULATOR) can access users without orgId restrictions
    // Company roles can only access users in their org
    if (actor.role !== "SUPER_ADMIN" && !isPlatformRole(actor.role)) {
        // Company roles must check orgId match
        if (!user.orgId || !actor.orgId || String(user.orgId) !== String(actor.orgId)) {
            throw new AppError("Forbidden", 403, "FORBIDDEN")
        }
    }

    const result = toUserPublic(user);
    await cacheSet(cacheKey, result, CacheTTL.USER);
    return result;
}
