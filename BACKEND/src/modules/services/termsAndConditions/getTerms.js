import * as TermsRepository from "../../repositories/termsAndConditions.repositories.js";
import { toTermsItem } from "../../mappers/termsAndConditions.mapper.js";
import { cacheGet, cacheSet } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function getTerms({ search } = {}) {
    const cacheKey = search
        ? `${CachePrefix.TERMS}search:${search.toLowerCase()}`
        : `${CachePrefix.TERMS}global`;

    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const docs = await TermsRepository.findAll({ search });

    const response = docs.map(toTermsItem);
    await cacheSet(cacheKey, response, CacheTTL.TERMS);
    return response;
}
