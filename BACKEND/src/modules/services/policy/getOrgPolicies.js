import * as PolicyRepository from "../../repositories/policy.repositories.js";
import { toPolicyItem } from "../../mappers/policy.mapper.js";
import { cacheGet, cacheSet } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function getPolicies({ search } = {}) {
    // Scope cache key per search term so different searches don't collide
    const cacheKey = search
        ? `${CachePrefix.POLICY}search:${search.toLowerCase()}`
        : `${CachePrefix.POLICY}global`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const docs = await PolicyRepository.findAll({ search });

    const response = docs.map(toPolicyItem);
    await cacheSet(cacheKey, response, CacheTTL.POLICY);
    return response;
}
