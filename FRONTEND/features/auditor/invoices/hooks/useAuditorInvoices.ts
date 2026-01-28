"use client"

import { useState, useMemo } from "react"
import { MOCK_AUDITOR_INVOICES } from "@/hooks/mock-data"
import { InvoiceStatus } from "@/lib/types"

// Create a local type for Auditor Invoice if strict typing is needed, 
// or imply it from the mock data. The mock data has specific fields.
// MOCK_AUDITOR_INVOICES has keys: _id, invoiceNo, companyName, date, totals_total, ai_verdict, status

export type AuditorInvoice = typeof MOCK_AUDITOR_INVOICES[0]

export type SortConfig = {
    key: keyof AuditorInvoice
    direction: "asc" | "desc"
} | null

export type InvoiceStatusFilter = "all" | string // MOCK_AUDITOR_INVOICES uses "Verified", "Pending", "Flagged", "Fraud", "Fraudulent"

export function useAuditorInvoices() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    const requestSort = (key: keyof AuditorInvoice) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedInvoices = useMemo(() => {
        let processed = [...MOCK_AUDITOR_INVOICES]

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            processed = processed.filter(inv =>
                inv.invoiceNo.toLowerCase().includes(lowerSearch) ||
                (inv.companyName && inv.companyName.toLowerCase().includes(lowerSearch))
            )
        }

        // Filter by Status
        // Note: Mock data has capitalized statuses "Verified", "Pending" etc.
        // We should handle case insensitivity or match exactly.
        if (statusFilter !== "all") {
            // The filter value from UI might be lowercase "verified", mock is "Verified"
            // Let's normalize to lowercase for comparison
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

                if (sortConfig.key === 'date') {
                    const dateA = new Date(aValue as string).getTime()
                    const dateB = new Date(bValue as string).getTime()
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
    }, [search, statusFilter, sortConfig])

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
