"use client"

import { useState, useMemo } from "react"
import { mockInvoices } from "@/lib/mock-data"
import { Invoice } from "@/lib/types"
import { SortConfig, InvoiceStatusFilter } from "@/hooks/invoices/use-auditor-invoices"

export function useFlaggedQueue() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(8)
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "invoiceDate", direction: "desc" })

    const requestSort = (key: keyof Invoice) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const flaggedInvoices = useMemo(() => {
        // Base Set: Invoices that are AI Flagged or have High Risk or Status Flagged
        return mockInvoices.filter(i =>
            i.ai_verdict === 'flagged' ||
            i.status === 'flagged' ||
            i.status === 'fraudulent' ||
            i.ai_riskScore >= 0.7
        )
    }, [])

    const filteredAndSortedInvoices = useMemo(() => {
        let processed = [...flaggedInvoices]

        // Filter by Search
        if (search) {
            processed = processed.filter(inv =>
                inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
                (inv.companyName && inv.companyName.toLowerCase().includes(search.toLowerCase()))
            )
        }

        // Filter by Status (Dropdown)
        if (statusFilter !== "all") {
            processed = processed.filter(inv => inv.status === statusFilter)
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                const aValue = a[sortConfig.key]
                const bValue = b[sortConfig.key]

                if (aValue === bValue) return 0
                if (aValue === undefined || aValue === null) return 1
                if (bValue === undefined || bValue === null) return -1

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
