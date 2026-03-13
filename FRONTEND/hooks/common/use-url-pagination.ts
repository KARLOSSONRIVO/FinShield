import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { PaginationQuery, StatusFilter, AiVerdictFilter } from '@/lib/types'

export function useUrlPagination(defaultLimit = 8) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Number(searchParams.get('limit')) || defaultLimit

    const search = searchParams.get('search') || undefined
    const sortBy = searchParams.get('sortBy') || undefined
    const order = (searchParams.get('order') as 'asc' | 'desc') || undefined

    // Filter Parameters from URL
    const statusFilter = (searchParams.get('reviewDecision') || "all") as StatusFilter
    const aiVerdictFilter = (searchParams.get('verdict') || "all") as AiVerdictFilter

    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const dateRange = (fromParam || toParam) ? {
        from: fromParam ? new Date(fromParam) : undefined,
        to: toParam ? new Date(toParam) : undefined
    } : undefined

    const createQueryString = useCallback(
        (updates: Record<string, string | number | undefined | null>) => {
            const params = new URLSearchParams(searchParams.toString())

            Object.entries(updates).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '' || value === "all") {
                    params.delete(key)
                } else {
                    params.set(key, String(value))
                }
            })

            return params.toString()
        },
        [searchParams]
    )

    const setPage = (newPage: number) => {
        router.push(pathname + '?' + createQueryString({ page: newPage }))
    }

    const setSearch = (newSearch: string) => {
        router.push(pathname + '?' + createQueryString({ search: newSearch, page: 1 }))
    }

    const setSort = (newSortBy: string, direction?: 'asc' | 'desc') => {
        if (direction !== undefined) {
            // Explicit direction provided (e.g. from dropdown menus)
            router.push(pathname + '?' + createQueryString({ sortBy: newSortBy, order: direction, page: 1 }))
        } else if (sortBy !== newSortBy) {
            // New column clicked → start at asc
            router.push(pathname + '?' + createQueryString({ sortBy: newSortBy, order: 'asc', page: 1 }))
        } else if (order === 'asc') {
            // Same column, currently asc → switch to desc
            router.push(pathname + '?' + createQueryString({ sortBy: newSortBy, order: 'desc', page: 1 }))
        } else {
            // Same column, currently desc → reset (remove sort)
            router.push(pathname + '?' + createQueryString({ sortBy: null, order: null, page: 1 }))
        }
    }

    const setStatusFilter = (val: StatusFilter) => {
        router.push(pathname + '?' + createQueryString({ reviewDecision: val, page: 1 }))
    }

    const setAiVerdictFilter = (val: AiVerdictFilter) => {
        router.push(pathname + '?' + createQueryString({ verdict: val, page: 1 }))
    }

    const setDateRange = (range: { from?: Date, to?: Date } | undefined) => {
        const updates: Record<string, string | null> = {
            from: range?.from ? range.from.toISOString() : null,
            to: range?.to ? range.to.toISOString() : null
        }
        router.push(pathname + '?' + createQueryString({ ...updates, page: 1 }))
    }

    const resetFilters = () => {
        router.push(pathname)
    }

    // Generic single-key filter setter (used by audit logs, custom filters, etc.)
    const setFilter = (key: string, value: string | null | undefined) => {
        router.push(pathname + '?' + createQueryString({ [key]: value ?? null, page: 1 }))
    }

    // Multi-key filter setter — sets/clears multiple URL params at once
    const setFilters = (updates: Record<string, string | null | undefined>) => {
        const mapped: Record<string, string | null> = {}
        Object.entries(updates).forEach(([k, v]) => { mapped[k] = v ?? null })
        router.push(pathname + '?' + createQueryString({ ...mapped, page: 1 }))
    }

    const filterParams = {
        search,
        sortBy,
        order,
        reviewDecision: statusFilter === "all" ? undefined : statusFilter,
        aiVerdict: aiVerdictFilter === "all" ? undefined : aiVerdictFilter,
        from: fromParam || undefined,
        to: toParam || undefined,
    }

    const queryParams: PaginationQuery = {
        page,
        limit,
        ...filterParams
    }

    const hasActiveFilters =
        statusFilter !== "all" ||
        aiVerdictFilter !== "all" ||
        !!fromParam ||
        !!toParam

    return {
        page,
        limit,
        search,
        sortBy,
        order,
        queryParams,
        filterParams,
        setPage,
        setSearch,
        setSort,

        // Filters
        statusFilter,
        setStatusFilter,
        aiVerdictFilter,
        setAiVerdictFilter,
        dateRange,
        setDateRange,

        resetFilters,
        hasActiveFilters,

        // Generic filter setters for custom URL params
        setFilter,
        setFilters,
    }
}
