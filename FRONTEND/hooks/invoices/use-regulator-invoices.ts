"use client"

import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "../common/use-url-pagination"

export type InvoiceStatusFilter = "all" | "pending" | "verified" | "flagged" | "fraudulent"

export function useRegulatorInvoices({ initialLimit = 5 } = {}) {
    // 1. URL State Hook
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort, setFilter
    } = useUrlPagination(initialLimit)

    // Pull status filter from URL or default to "all"
    const statusFilter = ((queryParams as any).statusFilter as InvoiceStatusFilter) || "all"

    // 2. Data Fetching
    const { data, isLoading, isError } = useQuery({
        // Include statusFilter in queryKey and params so React Query refetches when it changes
        queryKey: ["invoices", queryParams, statusFilter],
        queryFn: async () => {
            // Because the frontend Invoice component uses a local 'status' filter mapped from the ledger,
            // we will fetch the paginated page normally and let the backend (or our wrapper) handle it if possible.
            // *NOTE*: The blockchain service currently doesn't natively map `statusFilter` to `status` in the backend API query param unless explicitly supported. 
            // We'll pass it anyway; if the backend ignores it, we'd need to fetch all and filter locally, but for now we follow the pagination pattern.

            // Map the frontend filter 'statusFilter' to the backend param if needed. 
            // If the status is 'all', we omit the filter from the backend request.
            const apiParams: Record<string, any> = { ...queryParams }
            if (statusFilter !== "all") {
                apiParams.status = statusFilter
            }
            delete apiParams.statusFilter // clean up frontend-only params before sending

            const response = await InvoiceService.list(apiParams)
            return {
                items: response.data.items || [],
                pagination: response.data.pagination || { total: 0, page: 1, limit: 5, totalPages: 1 }
            }
        }
    })

    return {
        // Table Data & Pagination
        invoices: data?.items || [],
        pagination: data?.pagination,
        isLoading,
        isError,

        // URL Pagination Handlers
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'desc' } : null,
        requestSort: setSort,

        // Filters
        statusFilter,
        setStatusFilter: (val: string) => setFilter('statusFilter', val),
    }
}
