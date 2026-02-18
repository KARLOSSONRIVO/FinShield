"use client"

import { useState, useMemo } from "react"
import { mockInvoices } from "@/lib/mock-data"
import { Invoice } from '@/types'

export type SortConfig = {
    key: keyof Invoice
    direction: 'asc' | 'desc'
}

export function useRegulatorBlockchain() {
    const [search, setSearch] = useState("")
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "blockchain_anchoredAt",
        direction: "desc"
    })
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    
    const filteredAndSortedInvoices = useMemo(() => {
        
        let result = mockInvoices.filter(inv => inv.status === 'verified' && inv.blockchain_txHash)

        
        if (search) {
            const lowerSearch = search.toLowerCase()
            result = result.filter(inv =>
                inv.blockchain_txHash?.toLowerCase().includes(lowerSearch) ||
                (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(lowerSearch))
            )
        }

        
        result.sort((a, b) => {
            const aValue = a[sortConfig.key]
            const bValue = b[sortConfig.key]

            if ((aValue === undefined || aValue === null) && (bValue === undefined || bValue === null)) return 0
            if (aValue === undefined || aValue === null) return 1
            if (bValue === undefined || bValue === null) return -1

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1
            }
            return 0
        })

        return result
    }, [search, sortConfig])

    
    const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentInvoices = filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage)

    const requestSort = (key: keyof Invoice) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
        }))
    }

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
