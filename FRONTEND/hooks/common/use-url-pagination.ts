import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { PaginationQuery } from '@/lib/types'

export function useUrlPagination(defaultLimit = 5) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const page = Math.max(1, Number(searchParams.get('page')) || 1)

    // Parse limit, falling back to default, and strictly clamp between 1 and 5
    const rawLimit = Number(searchParams.get('limit')) || defaultLimit
    const limit = Math.min(defaultLimit, Math.max(1, rawLimit))

    const search = searchParams.get('search') || undefined
    const sortBy = searchParams.get('sortBy') || undefined
    const order = (searchParams.get('order') as 'asc' | 'desc') || undefined

    // Create a new URLSearchParams object, updating or deleting the specified key/value pairs
    const createQueryString = useCallback(
        (updates: Record<string, string | number | undefined | null>) => {
            const params = new URLSearchParams(searchParams.toString())

            Object.entries(updates).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') {
                    params.delete(key)
                } else {
                    params.set(key, String(value))
                }
            })

            return params.toString()
        },
        [searchParams]
    )

    const setPage = useCallback((newPage: number, totalPages?: number) => {
        let targetPage = Math.max(1, newPage)
        if (totalPages !== undefined) {
            targetPage = Math.min(targetPage, totalPages)
        }

        // Only push if it's actually changing to avoid infinite loops
        if (targetPage !== page) {
            router.push(pathname + '?' + createQueryString({ page: targetPage }))
        }
    }, [page, pathname, router, createQueryString])

    // Removed setPage from here since it's defined above

    const setSearch = (newSearch: string) => {
        // Reset to page 1 when searching
        router.push(pathname + '?' + createQueryString({ search: newSearch, page: 1 }))
    }

    const setSort = (newSortBy: string, newOrder?: 'asc' | 'desc') => {
        if (sortBy === newSortBy && order === 'desc' && !newOrder) {
            // Toggle off sort if clicking desc again
            router.push(pathname + '?' + createQueryString({ sortBy: null, order: null, page: 1 }))
        } else if (sortBy === newSortBy && !newOrder) {
            // Toggle to desc if currently asc
            router.push(pathname + '?' + createQueryString({ sortBy: newSortBy, order: 'desc', page: 1 }))
        } else {
            // Set new sort
            router.push(pathname + '?' + createQueryString({ sortBy: newSortBy, order: newOrder || 'asc', page: 1 }))
        }
    }

    const setFilter = (key: string, value: string | undefined | null) => {
        router.push(pathname + '?' + createQueryString({ [key]: value, page: 1 }))
    }

    const setFilters = (updates: Record<string, string | undefined | null>) => {
        router.push(pathname + '?' + createQueryString({ ...updates, page: 1 }))
    }

    const queryParams: PaginationQuery = {
        page,
        limit,
        ...(search && { search }),
        ...(sortBy && { sortBy }),
        ...(order && { order })
    }

    return {
        page,
        limit,
        search,
        sortBy,
        order,
        queryParams,
        setPage,
        setSearch,
        setSort,
        setFilter,
        setFilters
    }
}
