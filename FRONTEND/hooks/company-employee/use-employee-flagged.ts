import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"
import { Invoice } from "@/lib/types"

export function useEmployeeFlaggedQueue() {
    const {
        page, limit, search, sortBy, order, queryParams, filterParams,
        setPage, setSearch, setSort,
        statusFilter, setStatusFilter,
        aiVerdictFilter, setAiVerdictFilter,
        dateRange, setDateRange,
        resetFilters, hasActiveFilters
    } = useUrlPagination(8)

    // Fetch Invoices from API (Employee scoped)
    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ["employee-flagged-invoices", filterParams.search, filterParams.sortBy, filterParams.order, filterParams.reviewDecision],
        queryFn: () => InvoiceService.myInvoices({
            search: filterParams.search,
            sortBy: filterParams.sortBy,
            order: filterParams.order,
            reviewDecision: filterParams.reviewDecision,
        })
    })
    const allInvoices = (response as any)?.data?.items || []

    const { filteredInvoices, pagination } = useMemo(() => {
        let items = allInvoices.filter((inv: any) => {
            const verdict = inv.aiVerdict?.verdict?.toLowerCase()
            const status = inv.status?.toLowerCase()

            const isFlagged = verdict === "flagged" || status === "flagged"

            if (aiVerdictFilter === "all" && !isFlagged) return false
            if (aiVerdictFilter !== "all" && verdict !== aiVerdictFilter) return false

            if (statusFilter !== "all" && status !== statusFilter?.toLowerCase()) return false

            if (dateRange?.from || dateRange?.to) {
                const dateStr = inv.invoiceDate || inv.date || inv.createdAt
                if (!dateStr) return false
                const date = new Date(dateStr)
                if (isNaN(date.getTime())) return false

                if (dateRange.from && date < dateRange.from) return false
                if (dateRange.to) {
                    const toDate = new Date(dateRange.to)
                    toDate.setHours(23, 59, 59, 999)
                    if (date > toDate) return false
                }
            }

            return true
        })

        if (sortBy) {
            items.sort((a: any, b: any) => {
                const aValue = (a as any)[sortBy]
                const bValue = (b as any)[sortBy]
                if (aValue === bValue) return 0
                if (aValue === undefined || aValue === null) return 1
                if (bValue === undefined || bValue === null) return -1
                if (sortBy === 'invoiceDate' || sortBy === 'createdAt' || sortBy === 'date') {
                    const dateA = new Date(aValue).getTime()
                    const dateB = new Date(bValue).getTime()
                    return order === "asc" ? dateA - dateB : dateB - dateA
                }
                return order === "asc" ? (aValue < bValue ? -1 : 1) : (aValue > bValue ? -1 : 1)
            })
        }

        const total = items.length
        const totalPages = Math.ceil(total / limit)
        const start = (page - 1) * limit
        const paginatedItems = items.slice(start, start + limit)

        return {
            filteredInvoices: paginatedItems,
            pagination: { total, page, limit, totalPages }
        }
    }, [allInvoices, aiVerdictFilter, statusFilter, dateRange, sortBy, order, page, limit])

    return {
        invoices: filteredInvoices,
        pagination: { ...pagination, setPage },
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy as keyof Invoice, direction: (order || "asc") as "asc" | "desc" } : null,
        requestSort: setSort,
        aiVerdictFilter,
        setAiVerdictFilter,
        dateRange,
        setDateRange,
        resetFilters,
        hasActiveFilters,
        isLoading,
        isError,
        error: error ? (error as any).message : null
    }
}
