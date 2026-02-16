"use client"

import { useState, useMemo } from "react"
import { MOCK_AUDITOR_INVOICES } from "@/hooks/mock-data"
import { SortConfig, InvoiceStatusFilter } from "@/hooks/invoices/use-auditor-invoices"
import { Invoice } from "@/lib/types"

// Map mock data to Invoice type
const mappedInvoices: Invoice[] = MOCK_AUDITOR_INVOICES.map(inv => ({
    _id: inv._id,
    invoiceNo: inv.invoiceNo,
    companyName: inv.companyName || "Unknown Company",
    invoiceDate: new Date(inv.date || new Date().toISOString()),
    totals_total: inv.totals_total,
    ai_verdict: (['clean', 'flagged'].includes(inv.ai_verdict) ? inv.ai_verdict : 'flagged') as "clean" | "flagged",
    status: (inv.status.toLowerCase() as any) || "pending",
    // Defaults for missing fields
    companyOrgId: "mock-org-id",
    uploadedByUserId: "mock-user-id",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
    ai_riskScore: inv.ai_riskScore || 0,
    ai_analysis: "",
    blockchain_txHash: "",
    blockchain_anchoredAt: undefined,
    fileHashSha256: "mock-hash",
    ipfsCid: "mock-cid"
}))

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
        return mappedInvoices.filter(i =>
            i.ai_verdict === 'flagged' ||
            i.status === 'flagged' ||
            i.status === 'fraudulent' ||
            (i.ai_riskScore || 0) >= 60 // Mock data uses 0-100 score? Let's check. Yes, 65, 85.
        )
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
