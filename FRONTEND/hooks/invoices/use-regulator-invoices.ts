"use client"

import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "../common/use-url-pagination"

export type SortConfig = {
    key: "createdAt" | "invoiceNumber" | "invoiceDate" | "totalAmount" | "reviewDecision" | "organizationId"
    direction: 'asc' | 'desc'
}

export function useRegulatorInvoices({ initialLimit = 7 } = {}) {
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort
    } = useUrlPagination(initialLimit)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["invoices", "regulator", queryParams],
        queryFn: async () => {
            const apiParams: Record<string, any> = { ...queryParams }

            const allowedSortKeys = ["createdAt", "invoiceNumber", "invoiceDate", "totalAmount", "reviewDecision", "organizationId"]
            const fetchParams = {
                ...apiParams,
                sortBy: apiParams.sortBy && allowedSortKeys.includes(apiParams.sortBy) ? apiParams.sortBy : undefined
            }

            const response = await InvoiceService.list(fetchParams)
            return {
                items: response.data.items || [],
                pagination: response.data.pagination || { total: 0, page: 1, limit: initialLimit, totalPages: 1 }
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
        sortConfig: sortBy ? { key: sortBy as SortConfig['key'], direction: order || 'desc' } : null,
        requestSort: setSort,
    }
}