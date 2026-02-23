"use client"

import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"

export type MyInvoiceStatusFilter = "all" | "pending" | "verified" | "flagged" | "fraudulent"

export function useEmployeeInvoices({ initialLimit = 10 } = {}) {
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort, setFilter
    } = useUrlPagination(initialLimit)

    const statusFilter = ((queryParams as any).statusFilter as MyInvoiceStatusFilter) || "all"

    const { data, isLoading, isError } = useQuery({
        queryKey: ["invoices", "employee", queryParams, statusFilter],
        queryFn: async () => {
            const apiParams: Record<string, any> = { ...queryParams }
            if (statusFilter !== "all") {
                apiParams.status = statusFilter
            }
            delete apiParams.statusFilter

            const response = await InvoiceService.myInvoices(apiParams)
            return {
                items: response.data.items || [],
                pagination: response.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
            }
        }
    })

    return {
        invoices: data?.items || [],
        pagination: data?.pagination,
        isLoading,
        isError,
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'desc' } : null,
        requestSort: setSort,
        statusFilter,
        setStatusFilter: (val: string) => setFilter('statusFilter', val),
    }
}
