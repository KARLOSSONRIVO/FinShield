"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Invoice } from "@/lib/types"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"

export type InvoiceStatusFilter = "all" | "pending" | "verified" | "flagged" | "fraudulent"

export type SortConfig = {
    key: keyof Invoice | string
    direction: 'asc' | 'desc'
}

export function useSuperAdminInvoices({ initialLimit = 10 } = {}) { // Renamed from useInvoices
    // 1. URL State Hook
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort, setFilter
    } = useUrlPagination(initialLimit)

    // Pull status filter from URL or default to "all"
    const statusFilter = ((queryParams as any).statusFilter as InvoiceStatusFilter) || "all"

    const { data, isLoading, isError } = useQuery({
        // Include statusFilter in queryKey and params so React Query refetches when it changes
        queryKey: ["invoices", "super-admin", queryParams, statusFilter],
        queryFn: async () => {
            // Let the backend handle pagination and filtering if possible.
            const apiParams: Record<string, any> = { ...queryParams }
            if (statusFilter !== "all") {
                apiParams.status = statusFilter
            }
            delete apiParams.statusFilter // clean up frontend-only params before sending

            const response = await InvoiceService.list(apiParams)
            return {
                items: response.data.items || [],
                pagination: response.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
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
