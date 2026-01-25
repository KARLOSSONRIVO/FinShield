"use client"

import { useState, useMemo } from "react"
import { mockInvoices } from "@/lib/mock-data"
import { Invoice, InvoiceStatus } from "@/lib/types"

export type SortConfig = {
    key: keyof Invoice
    direction: "asc" | "desc"
} | null

export type InvoiceStatusFilter = "all" | InvoiceStatus

export function useFlaggedQueue() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    const requestSort = (key: keyof Invoice) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const flaggedInvoices = useMemo(() => {
        // Base Set: Invoices that are AI Flagged or have High Risk or Status Flagged
        // Basically anything that needs attention. 
        // Logic: AI Verdict = Flagged OR Risk Score > 0.5 (example) OR Status = Flagged/Fraud
        // The screenshot shows "Pending", "Fraud", "Flagged".
        // It seems to be a queue of "Suspicious" items.
        // Let's stick to: AI Verdict == 'flagged' OR AI Risk >= 0.7 OR Status == 'flagged' OR Status == 'fraudulent'
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
                // @ts-ignore
                const aValue = a[sortConfig.key]
                // @ts-ignore
                const bValue = b[sortConfig.key]

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
