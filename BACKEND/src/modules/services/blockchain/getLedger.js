import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toLedgerEntry } from "../../mappers/invoice.mapper.js";
import Assignment from "../../models/assignment.model.js";
import { cacheGet, cacheSet, buildQueryHash } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function getLedger({ actor, query }) {
    let orgIds = undefined;

    if (actor.role === "AUDITOR") {
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
                pagination: { page: query.page ?? 1, limit: query.limit ?? 20, total: 0, totalPages: 0 },
            };
        }

        orgIds = assignedOrgIds;
    }

    const queryHash = buildQueryHash({ role: actor.role, sub: actor.sub, ...query });
    const cacheKey = `${CachePrefix.LEDGER}${queryHash}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const result = await InvoiceRepository.findAnchoredLedger({ ...query, orgIds });

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
