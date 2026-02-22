"use client"

import { useState, useMemo } from "react"
import { SortConfig, InvoiceStatusFilter } from "@/hooks/invoices/use-auditor-invoices"
import { Invoice } from "@/lib/types"

export function useAuditorFlaggedQueue() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "invoiceDate", direction: "desc" })

    const requestSort = (key: keyof Invoice) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    // Base Set: Invoices that are AI Flagged or have High Risk or Status Flagged
    const flaggedInvoices = useMemo(() => {
        // Mock data removed. Requires API integration.
        return [] as Invoice[];
    }, [])

    const filteredAndSortedInvoices = useMemo(() => {
        let processed = [...flaggedInvoices]

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            processed = processed.filter(inv =>
                (inv.invoiceNo || "").toLowerCase().includes(lowerSearch) ||
                (inv.companyName && inv.companyName.toLowerCase().includes(lowerSearch))
            )
        }

        // Filter by Status (Dropdown)
        if (statusFilter !== "all") {
            processed = processed.filter(inv => inv.status.toLowerCase() === statusFilter.toLowerCase())
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                const aValue = a[sortConfig.key]
                const bValue = b[sortConfig.key]

                if (aValue === bValue) return 0
                if (aValue === undefined || aValue === null) return 1
                if (bValue === undefined || bValue === null) return -1

                if (sortConfig.key === 'invoiceDate' || sortConfig.key === 'createdAt') {
                    const dateA = new Date(aValue as string | Date).getTime()
                    const dateB = new Date(bValue as string | Date).getTime()
                    if (dateA < dateB) return sortConfig.direction === "asc" ? -1 : 1
                    if (dateA > dateB) return sortConfig.direction === "asc" ? 1 : -1
                    return 0
                }

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [flaggedInvoices, search, statusFilter, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentInvoices = filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage)

    return {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,

        invoices: currentInvoices,
        currentPage,
        totalPages,
        setCurrentPage,

        sortConfig,
        requestSort
    }
}
