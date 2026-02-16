"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Invoice } from "@/lib/types"
import { InvoiceService } from "@/services/invoice.service"
import { useAuth } from "@/hooks/use-auth" // Assuming we filter by user's org if backend doesn't already

export type InvoiceStatusFilter = "all" | "pending" | "verified" | "flagged" | "fraudulent"

export type SortConfig = {
    key: keyof Invoice
    direction: 'asc' | 'desc'
}

export function useManagerInvoices() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "invoiceDate",
        direction: "desc"
    })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Backend should filter by the logged-in user's organization automatically
    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ["invoices", "manager"],
        queryFn: InvoiceService.getAll
    })

    const filteredAndSortedInvoices = useMemo(() => {
        let result = [...invoices]

        // 1. Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            result = result.filter(invoice =>
                (invoice.invoiceNo || "").toLowerCase().includes(lowerSearch) ||
                (invoice.totals_total || 0).toString().includes(lowerSearch)
            )
        }

        // 2. Status Filter
        if (statusFilter !== "all") {
            result = result.filter(invoice => invoice.status.toLowerCase() === statusFilter)
        }

        // 3. Sorting
        result.sort((a, b) => {
            const aValue = a[sortConfig.key]
            const bValue = b[sortConfig.key]

            if ((aValue === undefined || aValue === null) && (bValue === undefined || bValue === null)) return 0
            if (aValue === undefined || aValue === null) return 1
            if (bValue === undefined || bValue === null) return -1

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
            return 0
        })

        return result
    }, [invoices, search, statusFilter, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentInvoices = filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage)

    const handleSort = (key: keyof Invoice) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
        }))
    }

    return {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        sortConfig,
        requestSort: handleSort,
        invoices: currentInvoices,
        currentPage,
        totalPages,
        setCurrentPage,
        isLoading
    }
}
