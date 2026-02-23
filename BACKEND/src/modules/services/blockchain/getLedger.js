import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toLedgerEntry } from "../../mappers/invoice.mapper.js";
import { cacheGet, cacheSet, buildQueryHash } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function getLedger(query) {
    const queryHash = buildQueryHash(query);
    const cacheKey = `${CachePrefix.LEDGER}${queryHash}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await InvoiceRepository.findAnchoredLedger(query);

    const response = {
        items: result.items.map(toLedgerEntry),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };

    await cacheSet(cacheKey, response, CacheTTL.LEDGER);
    return response;
}
