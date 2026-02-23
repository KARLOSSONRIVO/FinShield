import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toMyInvoiceItem } from "../../mappers/invoice.mapper.js";
import { cacheGet, cacheSet, buildQueryHash } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

/**
 * List invoices uploaded by the current COMPANY_USER (employee).
 * Returns a simplified payload (no AI verdict, includes file name & anchor status).
 */
export async function listMyInvoices({ actor, query }) {
    const { page, limit, search, sortBy, order } = query;

    const filter = { uploadedByUserId: actor.sub };

    // Build cache key from user + query params
    const queryHash = buildQueryHash({ sub: actor.sub, page, limit, search, sortBy, order });
    const cacheKey = `${CachePrefix.INV_MY}${queryHash}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await InvoiceRepository.findAllInvoicesPaginated({
        filter,
        page,
        limit,
        search,
        sortBy,
        order,
    });

    const response = {
        items: result.items.map(toMyInvoiceItem),
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        },
    };

    await cacheSet(cacheKey, response, CacheTTL.INV_MY);
    return response;
}
