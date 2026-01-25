"use client"

import { useState, useMemo } from "react"
import { mockInvoices } from "@/lib/mock-data"
import { Invoice } from "@/lib/types"

export type SortConfig = {
    key: keyof Invoice
    direction: "asc" | "desc"
} | null

export function useBlockchain() {
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

    const verifiedInvoices = useMemo(() => {
        return mockInvoices.filter(i => i.status === 'verified' && i.blockchain_txHash)
    }, [])

    const filteredAndSortedInvoices = useMemo(() => {
        let processed = [...verifiedInvoices]

        // Filter by Search
        if (search) {
            processed = processed.filter(inv =>
                inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
                (inv.companyName && inv.companyName.toLowerCase().includes(search.toLowerCase())) ||
                (inv.blockchain_txHash && inv.blockchain_txHash.toLowerCase().includes(search.toLowerCase()))
            )
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
