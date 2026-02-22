import { apiClient as api } from '@/lib/api-client'
import { PaginatedResponse, PaginationQuery, Invoice } from '@/lib/types'

export interface BlockchainLedgerItem {
    id: string
    invoiceNumber: string
    company: string
    transactionHash: string
    anchoredAt: string
    status: string
}

export const blockchainService = {
    getLedger: async (params?: PaginationQuery): Promise<PaginatedResponse<BlockchainLedgerItem>> => {
        const response = await api.get('/blockchain/ledger', { params })
        return response.data
    }
}
