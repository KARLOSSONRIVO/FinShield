"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"

export type MyInvoiceStatusFilter = "all" | "pending" | "clean" | "flagged"

export type SortConfig = {
    key: "createdAt" | "invoiceNumber" | "invoiceDate" | "totalAmount" | "reviewDecision"
    direction: 'asc' | 'desc'
}

export function useEmployeeInvoices({ initialLimit = 7 } = {}) {
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort, setFilter
    } = useUrlPagination(initialLimit)

    // *Local* Frontend Status Filter
    const [localStatusFilter, setLocalStatusFilter] = useState<MyInvoiceStatusFilter>("all")

    const { data, isLoading, isError } = useQuery({
        queryKey: ["invoices", "employee", queryParams],
        queryFn: async () => {
            const apiParams: Record<string, any> = { ...queryParams }
            delete apiParams.statusFilter // clean up possible old frontend params

            const allowedSortKeys = ["createdAt", "invoiceNumber", "invoiceDate", "totalAmount", "reviewDecision"]
            const fetchParams = {
                ...apiParams,
                sortBy: apiParams.sortBy && allowedSortKeys.includes(apiParams.sortBy) ? apiParams.sortBy : undefined
            }

            const response = await InvoiceService.myInvoices(fetchParams)

            // Transform the data to match the structure expected by InvoiceTable
            // This ensures aiVerdict, amount, and date are properly mapped
            const transformedItems = (response.data.items || []).map((item: any) => ({
                ...item,
                // Ensure these fields exist for the table
                aiVerdict: item.aiVerdict || null,
                amount: item.totalAmount || item.amount || 0,
                date: item.invoiceDate || item.createdAt || item.uploadedAt,
                // Map status correctly
                status: item.reviewDecision || item.status || "pending"
            }))

            return {
                items: transformedItems,
                pagination: response.data.pagination || {
                    total: 0,
                    page: 1,
                    limit: initialLimit,
                    totalPages: 1
                }
            }
        }
    })

    // Frontend Filter 
    const filteredInvoices = useMemo(() => {
        if (!data?.items) return []
        let finalInvoices = data.items

        if (localStatusFilter !== "all") {
            finalInvoices = finalInvoices.filter((inv: any) =>
                inv.status?.toLowerCase() === localStatusFilter.toLowerCase()
            )
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

        // Filters - REMOVE THIS if InvoiceFilter doesn't accept it
        // statusFilter: localStatusFilter,
        // setStatusFilter: (val: string) => setLocalStatusFilter(val as MyInvoiceStatusFilter),
    }
}