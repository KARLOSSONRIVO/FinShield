import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { cacheGet, cacheSet, buildQueryHash } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function listUsers({ actor, orgId, query = {} }) {
    if (!actor) throw new AppError("Unauthorized", 403, "UNAUTHORIZED")

    const { page, limit, search, sortBy, order } = query;
    let filter = {};

    if (actor.role === "SUPER_ADMIN") {
        filter = orgId ? { orgId } : {}
    } else if (actor.role === "COMPANY_MANAGER") {
        if (!actor.orgId) {
            throw new AppError("Organization not found for user", 400, "ORG_NOT_FOUND")
        }
        filter = { orgId: actor.orgId }
    } else {
        throw new AppError("Forbidden", 403, "FORBIDDEN")
    }

    // Exclude the current user
    filter._id = { $ne: actor.userId || actor.sub };

    const queryHash = buildQueryHash({ role: actor.role, sub: actor.sub, orgId: actor.orgId, filter, page, limit, search, sortBy, order });
    const cacheKey = `${CachePrefix.USERS_LIST}${queryHash}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await UsersRepositories.findManyPaginated({ filter, page, limit, search, sortBy, order });

    const response = {
        items: result.items.map(toUserPublic),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };

    await cacheSet(cacheKey, response, CacheTTL.USERS_LIST);
    return response;
}
