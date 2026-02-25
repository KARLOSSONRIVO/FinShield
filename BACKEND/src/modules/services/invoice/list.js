import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toInvoiceListItem } from "../../mappers/invoice.mapper.js";
import Assignment from "../../models/assignment.model.js";
import { cacheGet, cacheSet, buildQueryHash } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

/**
 * List invoices with role-based scoping:
 * - SUPER_ADMIN / REGULATOR: all invoices (optional orgId filter)
 * - AUDITOR: invoices from assigned companies only
 * - COMPANY_MANAGER: all invoices in their organization (theirs + employees')
 * - COMPANY_USER: only their own uploaded invoices
 */
export async function listInvoices({ actor, query }) {
    const { page, limit, search, sortBy, order, orgId } = query;
    const filter = {};

    switch (actor.role) {
        case "SUPER_ADMIN":
        case "REGULATOR":
            if (orgId) filter.orgId = orgId;
            break;

        case "AUDITOR": {
            // Try to get auditor's assigned org IDs from cache
            const auditorCacheKey = `${CachePrefix.AUDITOR_ORGS}${actor.sub}`;
            let assignedOrgIds = await cacheGet(auditorCacheKey);

            if (!assignedOrgIds) {
                const assignments = await Assignment.find(
                    { auditorUserId: actor.sub, status: "active" },
                    { companyOrgId: 1 }
                ).lean();

                assignedOrgIds = assignments.map((a) => a.companyOrgId);
                await cacheSet(auditorCacheKey, assignedOrgIds, CacheTTL.AUDITOR_ORGS);
            }

            if (assignedOrgIds.length === 0) {
                return {
                    items: [],
                    pagination: { total: 0, page, limit, totalPages: 0 },
                };
            }

            filter.orgId = { $in: assignedOrgIds };
            break;
        }

        case "COMPANY_MANAGER":
            filter.orgId = actor.orgId;
            break;
    }

    // Build cache key from role scope + query params
    const queryHash = buildQueryHash({ role: actor.role, sub: actor.sub, orgId: actor.orgId, filter, page, limit, search, sortBy, order });
    const cacheKey = `${CachePrefix.INV_LIST}${queryHash}`;
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
        items: result.items.map(toInvoiceListItem),
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        },
    };

    await cacheSet(cacheKey, response, CacheTTL.INV_LIST);
    return response;
}
