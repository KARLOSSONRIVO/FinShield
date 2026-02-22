import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import { toLedgerEntry } from "../../mappers/invoice.mapper.js";

export async function getLedger(query) {
    const result = await InvoiceRepository.findAnchoredLedger(query);

    return {
        items: result.items.map(toLedgerEntry),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };
}
