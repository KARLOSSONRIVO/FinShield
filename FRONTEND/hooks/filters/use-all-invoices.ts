"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { Invoice } from "@/lib/types"

interface UseAllInvoicesOptions {
    defaultStatusFilter?: string
    defaultAiVerdictFilter?: "all" | "flagged" | "clean" | "pending"
}

export function useAllInvoices(options: UseAllInvoicesOptions = {}) {
    const {
        defaultStatusFilter = "all",
        defaultAiVerdictFilter = "all",
    } = options

    // Filter states
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState(defaultStatusFilter)
    const [aiVerdictFilter, setAiVerdictFilter] = useState(defaultAiVerdictFilter)
    const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>()

    // Sort states
    const [sortBy, setSortBy] = useState<keyof Invoice | null>(null)
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

    // Fetch all invoices (no pagination/limit params)
    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ["all-invoices"],
        queryFn: () => InvoiceService.list({}), // empty params = all invoices
    })

    const allInvoices = response?.data?.items || []

    // Apply all client‑side filters
    const filteredInvoices = useMemo(() => {
        return allInvoices.filter((inv: Invoice) => {
            // 1. Search on invoiceNumber
            if (search) {
                const invNum = inv.invoiceNumber?.toLowerCase() || ""
                if (!invNum.includes(search.toLowerCase())) return false
            }

            // 2. Status filter (reviewDecision)
            if (statusFilter !== "all" && inv.status !== statusFilter) return false

            // 3. AI verdict filter
            const verdict = inv.aiVerdict?.verdict?.toLowerCase()
            if (aiVerdictFilter !== "all" && verdict !== aiVerdictFilter) return false

            // 4. Date Range filter
            const dateStr = inv.invoiceDate || (inv as any).createdAt
            if (dateRange?.from || dateRange?.to) {
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
    }, [allInvoices, search, statusFilter, aiVerdictFilter, dateRange])

    // Apply sorting with robust undefined handling
    const sortedInvoices = useMemo(() => {
        if (!sortBy) return filteredInvoices

        return [...filteredInvoices].sort((a, b) => {
            const aVal = a[sortBy]
            const bVal = b[sortBy]

            // Helper to compare values with undefined handling
            const compare = (): number => {
                // Undefined handling: always place undefined at the end
                if (aVal === undefined && bVal === undefined) return 0
                if (aVal === undefined) return sortDirection === "asc" ? 1 : -1
                if (bVal === undefined) return sortDirection === "asc" ? -1 : 1

                // Now both are defined; prepare for comparison based on type
                let aComp: any = aVal
                let bComp: any = bVal

                // Handle dates
                if (sortBy === "invoiceDate" || sortBy === "createdAt") {
                    aComp = aVal ? new Date(aVal as string).getTime() : 0
                    bComp = bVal ? new Date(bVal as string).getTime() : 0
                }
                // Handle numbers
                else if (sortBy === "totalAmount") {
                    aComp = aVal || 0
                    bComp = bVal || 0
                }
                // Handle strings (case-insensitive)
                else if (typeof aVal === "string" && typeof bVal === "string") {
                    aComp = aVal.toLowerCase()
                    bComp = bVal.toLowerCase()
                }

                if (aComp < bComp) return sortDirection === "asc" ? -1 : 1
                if (aComp > bComp) return sortDirection === "asc" ? 1 : -1
                return 0
            }

            return compare()
        })
    }, [filteredInvoices, sortBy, sortDirection])

    // Sorting handler
    const requestSort = (key: keyof Invoice) => {
        if (sortBy === key) {
            // Toggle direction
            setSortDirection(prev => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortBy(key)
            setSortDirection("asc")
        }
    }

    // Reset all filters
    const resetFilters = () => {
        setSearch("")
        setStatusFilter(defaultStatusFilter)
        setAiVerdictFilter(defaultAiVerdictFilter)
        setDateRange(undefined)
        setSortBy(null)
        setSortDirection("asc")
    }

    const hasActiveFilters = useMemo(() => {
        return search !== "" ||
            statusFilter !== defaultStatusFilter ||
            aiVerdictFilter !== defaultAiVerdictFilter ||
            (dateRange?.from !== undefined || dateRange?.to !== undefined) ||
            sortBy !== null
    }, [search, statusFilter, defaultStatusFilter, aiVerdictFilter, defaultAiVerdictFilter, dateRange, sortBy])

    return {
        // All data (filtered and sorted)
        allInvoices: sortedInvoices,

        // Filter states and setters
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        aiVerdictFilter,
        setAiVerdictFilter,
        dateRange,
        setDateRange,

        // Sort
        sortBy,
        sortDirection,
        requestSort,

        // Utilities
        isLoading,
        isError,
        error: error ? (error as any).message : null,
        resetFilters,
        hasActiveFilters,
    }
}
