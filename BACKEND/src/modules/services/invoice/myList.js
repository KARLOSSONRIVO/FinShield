import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toMyInvoiceItem } from "../../mappers/invoice.mapper.js";

/**
 * List invoices uploaded by the current COMPANY_USER (employee).
 * Returns a simplified payload (no AI verdict, includes file name & anchor status).
 */
export async function listMyInvoices({ actor, query }) {
    const { page, limit, search, sortBy, order } = query;

    const filter = { uploadedByUserId: actor.sub };

    const result = await InvoiceRepository.findAllInvoicesPaginated({
        filter,
        page,
        limit,
        search,
        sortBy,
        order,
    });

    return {
        items: result.items.map(toMyInvoiceItem),
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
        },
    };
}
