import AppError from "../../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../../mappers/organization.mapper.js";
import { cacheGet, cacheSet, buildQueryHash } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function listOrganizations({ actor, query = {} }) {
    if (!actor || actor.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED")
    }
    const { page, limit, search, sortBy, order } = query;

    const queryHash = buildQueryHash({ page, limit, search, sortBy, order });
    const cacheKey = `${CachePrefix.ORGS_LIST}${queryHash}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await OrganizationRepositories.findManyPaginated({ filter: {}, page, limit, search, sortBy, order });

    const response = {
        items: result.items.map(toOrganizationPublic),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };

    await cacheSet(cacheKey, response, CacheTTL.ORGS_LIST);
    return response;
}
