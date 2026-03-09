"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Invoice } from "@/lib/types"
import { InvoiceService } from "@/services/invoice.service"
import { useAuth } from "@/hooks/global/use-auth" // Assuming we filter by user's org if backend doesn't already
import { useUrlPagination } from "@/hooks/common/use-url-pagination"

export type InvoiceStatusFilter = "all" | "pending" | "clean" | "flagged"

export type SortConfig = {
    key: "createdAt" | "invoiceNumber" | "invoiceDate" | "totalAmount" | "reviewDecision"
    direction: 'asc' | 'desc'
}

export function useManagerInvoices({ initialLimit = 7 } = {}) {
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort, setFilter
    } = useUrlPagination(initialLimit)

    // *Local* Frontend Status Filter
    const [localStatusFilter, setLocalStatusFilter] = useState<InvoiceStatusFilter>("all")

    const { data, isLoading, isError } = useQuery({
        queryKey: ["invoices", "manager", queryParams],
        queryFn: async () => {
            const apiParams: Record<string, any> = { ...queryParams }
            delete apiParams.statusFilter

            const allowedSortKeys = ["createdAt", "invoiceNumber", "invoiceDate", "totalAmount", "reviewDecision"]
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

    // Frontend Filter 
    const filteredInvoices = useMemo(() => {
        if (!data?.items) return []
        let finalInvoices = data.items

        if (localStatusFilter !== "all") {
            finalInvoices = finalInvoices.filter((inv: any) => inv.status.toLowerCase() === localStatusFilter.toLowerCase())
        }

        return finalInvoices
    }, [data?.items, localStatusFilter])

    const derivedPagination = useMemo(() => {
        if (!data?.pagination) return undefined
        return data.pagination
    }, [data?.pagination])

    return {
        // Table Data & Pagination
        invoices: filteredInvoices,
        pagination: derivedPagination,
        isLoading,
        isError,

        // URL Pagination Handlers
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'desc' } : null,
        requestSort: setSort,

        // Filters
        statusFilter: localStatusFilter,
        setStatusFilter: (val: string) => setLocalStatusFilter(val as InvoiceStatusFilter),
    }
}
