"use client"

import { useState, useMemo } from "react"
import { mockInvoices, mockAssignments } from "@/lib/mock-data"
import { Invoice } from "@/lib/types"

export type SortConfig = {
    key: keyof Invoice
    direction: "asc" | "desc"
} | null

export function useAuditorBlockchain() {
    const [search, setSearch] = useState("")

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

    // 2. Filter Invoices: Must be Verified AND have TxHash
    // Matching Super Admin logic as requested: "use the same data as superadmin"
    const verifiedInvoices = useMemo(() => {
        return mockInvoices.filter(i => i.status === 'verified' && i.blockchain_txHash)
    }, [])

    const filteredAndSortedInvoices = useMemo(() => {
        let processed = [...verifiedInvoices]

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            processed = processed.filter(inv =>
                inv.invoiceNo.toLowerCase().includes(lowerSearch) ||
                (inv.companyName && inv.companyName.toLowerCase().includes(lowerSearch)) ||
                (inv.blockchain_txHash && inv.blockchain_txHash.toLowerCase().includes(lowerSearch))
            )
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
    }, [verifiedInvoices, search, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentInvoices = filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage)

    return {
        search,
        setSearch,
        invoices: currentInvoices,
        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}
