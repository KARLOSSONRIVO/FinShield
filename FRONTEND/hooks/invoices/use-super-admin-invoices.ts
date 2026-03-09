"use client"

import { useContext, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"
import { SocketContext } from "@/providers/socket-provider"
import { useSocketEvent } from "@/hooks/global/use-socket-event"
import { SocketEvents } from "@/lib/socket-events"

export type SortConfig = {
    key: "createdAt" | "invoiceNumber" | "invoiceDate" | "totalAmount" | "reviewDecision" | "organizationId"
    direction: 'asc' | 'desc'
}

export function useSuperAdminInvoices({ initialLimit = 7 } = {}) {
    const queryClient = useQueryClient()
    const socketCtx = useContext(SocketContext)

    // Invalidate the invoice list when the server signals any change
    const invalidateList = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["invoices", "super-admin"] })
    }, [queryClient])

    useSocketEvent(socketCtx!, SocketEvents.INVOICE_LIST_INVALIDATE, invalidateList)
    useSocketEvent(socketCtx!, SocketEvents.INVOICE_AI_COMPLETE, invalidateList)
    useSocketEvent(socketCtx!, SocketEvents.INVOICE_FLAGGED, invalidateList)
    useSocketEvent(socketCtx!, SocketEvents.INVOICE_ANCHOR_SUCCESS, invalidateList)

    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort
    } = useUrlPagination(initialLimit)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["invoices", "super-admin", queryParams],
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