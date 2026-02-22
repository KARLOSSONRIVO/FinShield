import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toInvoiceListItem } from "../../mappers/invoice.mapper.js";
import Assignment from "../../models/assignment.model.js";

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
            const assignments = await Assignment.find(
                { auditorUserId: actor.sub, status: "ACTIVE" },
                { companyOrgId: 1 }
            ).lean();

            const assignedOrgIds = assignments.map((a) => a.companyOrgId);

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

    const result = await InvoiceRepository.findAllInvoicesPaginated({
        filter,
        page,
        limit,
        search,
        sortBy,
        order,
    });

    return {
        items: result.items.map(toInvoiceListItem),
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        },
    };
}
