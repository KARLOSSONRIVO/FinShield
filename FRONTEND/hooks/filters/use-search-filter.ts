"use client"

import { useState, useMemo, useCallback } from "react"

interface UseSearchFilterOptions<T> {
    items: T[]
    searchFields: (keyof T)[]
    statusField?: keyof T
    defaultStatus?: string
}

interface UseSearchFilterReturn<T> {
    search: string
    setSearch: (value: string) => void
    statusFilter: string
    setStatusFilter: (value: string) => void
    filteredItems: T[]
    resultCount: number
    clearFilters: () => void
    hasActiveFilters: boolean
}

export function useSearchFilter<T extends Record<string, any>>({
    items,
    searchFields,
    statusField,
    defaultStatus = "all",
}: UseSearchFilterOptions<T>): UseSearchFilterReturn<T> {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState(defaultStatus)

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            // Search filter - check all specified search fields
            const matchesSearch =
                search === "" ||
                searchFields.some((field) => {
                    const value = item[field]
                    if (typeof value === "string") {
                        return value.toLowerCase().includes(search.toLowerCase())
                    }
                    if (typeof value === "number") {
                        return value.toString().includes(search)
                    }
                    return false
                })

            // Status filter
            const matchesStatus =
                !statusField ||
                statusFilter === "all" ||
                statusFilter === defaultStatus ||
                item[statusField] === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [items, search, statusFilter, searchFields, statusField, defaultStatus])

    const clearFilters = useCallback(() => {
        setSearch("")
        setStatusFilter(defaultStatus)
    }, [defaultStatus])

    const hasActiveFilters = search !== "" || statusFilter !== defaultStatus

    return {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        filteredItems,
        resultCount: filteredItems.length,
        clearFilters,
        hasActiveFilters,
    }
}

// Convenience hook for invoice filtering (commonly used pattern)
export function useInvoiceFilter<
    T extends { invoiceNo: string; status: string }
>(invoices: T[]) {
    return useSearchFilter({
        items: invoices,
        searchFields: ["invoiceNo"],
        statusField: "status",
    })
}

// Convenience hook for user filtering
export function useUserFilter<
    T extends { name: string; email: string; role?: string }
>(users: T[]) {
    return useSearchFilter({
        items: users,
        searchFields: ["name", "email"],
        statusField: "role",
    })
}
