import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, LedgerInvoice } from "@/lib/types"

// Valid sortBy values per GET /blockchain/ledger docs
type LedgerSortBy = "anchoredAt" | "invoiceNumber"

interface LedgerParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: LedgerSortBy;
    order?: "asc" | "desc";
}

export const blockchainService = {
    getLedger: async (params?: LedgerParams): Promise<PaginatedResponse<LedgerInvoice>> => {
        // Enforce valid sortBy only
        const cleanParams = params ? { ...params } : {}
        if (cleanParams.sortBy && !["anchoredAt", "invoiceNumber"].includes(cleanParams.sortBy)) {
            delete cleanParams.sortBy
            delete cleanParams.order
        }
        const response = await apiClient.get<PaginatedResponse<LedgerInvoice>>("/blockchain/ledger", { params: cleanParams })
        return response.data
    }
}

// Named export kept for backward compatibility
export type BlockchainLedgerItem = LedgerInvoice
