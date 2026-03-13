"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { AuditService } from "@/services/audit.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"
import { AuditLogQuery } from "@/lib/types"
import { useSearchParams } from "next/navigation"

export function useAuditLogs() {
    const {
        page,
        limit,
        search,
        setSearch,
        queryParams,
        setPage,
        setSort,
        setFilter,
        setFilters
    } = useUrlPagination(8)

    const searchParams = useSearchParams()

    // Grab additional custom filters from URL
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined
    const action = searchParams.get("action") || undefined
    const actorRole = searchParams.get("actorRole") || undefined

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["audit-logs", queryParams, from, to, action, actorRole],
        queryFn: async () => {
            const fetchParams: AuditLogQuery = {
                ...queryParams,
                ...(from && { from }),
                ...(to && { to }),
                ...(action && { action }),
                ...(actorRole && { actorRole }),
            }

            const response = await AuditService.getLogs(fetchParams) as any

            // API returns a raw array — apply client-side pagination
            if (Array.isArray(response) || Array.isArray(response?.data)) {
                let rawArray = Array.isArray(response) ? response : response.data
                
                // Client-side filtering
                if (action) {
                    rawArray = rawArray.filter((log: any) => log.action === action)
                }
                if (actorRole) {
                    rawArray = rawArray.filter((log: any) => log.actorRole === actorRole)
                }
                if (fetchParams.search) {
                    const s = fetchParams.search.toLowerCase()
                    rawArray = rawArray.filter((log: any) => 
                        log.action?.toLowerCase().includes(s) || 
                        log.summary?.toLowerCase().includes(s) ||
                        log.actorEmail?.toLowerCase().includes(s)
                    )
                }

                const pageNum = fetchParams.page ?? 1
                const limitNum = fetchParams.limit ?? 5
                const startIndex = (pageNum - 1) * limitNum
                return {
                    items: rawArray.slice(startIndex, startIndex + limitNum),
                    pagination: {
                        total: rawArray.length,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(rawArray.length / limitNum) || 1
                    }
                }
            }

            // API returns flat shape: { items, total, page, limit, totalPages }
            if (response?.items && response?.totalPages != null) {
                return {
                    items: response.items,
                    pagination: {
                        total: response.total ?? 0,
                        page: response.page ?? 1,
                        limit: response.limit ?? 5,
                        totalPages: response.totalPages ?? 1
                    }
                }
            }

            // Shape: { ok, data: { items, total, page, limit, totalPages } }
            const d = response?.data
            return {
                items: d?.items ?? [],
                pagination: {
                    total: d?.total ?? 0,
                    page: d?.page ?? 1,
                    limit: d?.limit ?? 5,
                    totalPages: d?.totalPages ?? 1
                }
            }
        }
    })

    const auditLogs = data?.items || []
    const pagination = data?.pagination

    return {
        // Table Data & Pagination
        auditLogs,
        pagination,
        isLoading,
        isError,
        error: error ? (error as any).message : null,

        // URL Pagination Handlers
        page,
        setPage,
        search,
        setSearch,
        sortConfig: queryParams.sortBy ? { key: queryParams.sortBy, direction: (queryParams.order || 'desc') as 'asc' | 'desc' } : { key: 'createdAt', direction: 'desc' as 'asc' | 'desc' },
        requestSort: setSort,

        // Filters
        action,
        actorRole,
        from,
        to,
        setFilter,
        setFilters,
        refetch
    }
}
