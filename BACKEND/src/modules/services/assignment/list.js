import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { toAssignmentPublic } from "../../mappers/assignment.mapper.js";
import { cacheGet, cacheSet, buildQueryHash } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function listAssignments({ actor, query = {} }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can list assignments", 403, "FORBIDDEN")
    }

    const { page, limit, search, sortBy, order } = query;

    const queryHash = buildQueryHash({ page, limit, search, sortBy, order });
    const cacheKey = `${CachePrefix.ASSIGN_LIST}${queryHash}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await AssignmentRepositories.findManyPaginated({ filter: {}, page, limit, search, sortBy, order });

    const response = {
        items: result.items.map(toAssignmentPublic),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };

    await cacheSet(cacheKey, response, CacheTTL.ASSIGN_LIST);
    return response;
}
