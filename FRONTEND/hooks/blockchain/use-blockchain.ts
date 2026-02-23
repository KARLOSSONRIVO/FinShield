"use client"

import { useQuery } from "@tanstack/react-query"
import { blockchainService } from "@/services/blockchain.service"
import { useUrlPagination } from "../common/use-url-pagination"

export type SortConfig = {
    key: string
    direction: 'asc' | 'desc'
}

export function useBlockchain({ initialLimit = 10 } = {}) {
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort
    } = useUrlPagination(initialLimit)

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["blockchain", "ledger", queryParams],
        queryFn: async () => {
            const ledgerParams = {
                ...queryParams,
                sortBy: (queryParams.sortBy === "anchoredAt" || queryParams.sortBy === "invoiceNumber")
                    ? queryParams.sortBy
                    : undefined
            } as const
            const response = await blockchainService.getLedger(ledgerParams)

            return {
                items: response.data?.items || [],
                pagination: response.data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
            }
        }
    })

    return {
        // Table Data & Pagination
        invoices: data?.items || [],
        pagination: data?.pagination,
        isLoading,
        isError,
        error: error ? error.message : null,

        // URL Pagination Handlers
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'desc' } : null,
        requestSort: setSort
    }
}
