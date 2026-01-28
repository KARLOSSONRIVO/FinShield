"use client"

import { useState, useMemo } from "react"
import { mockInvoices } from "@/lib/mock-data"
import { Invoice, InvoiceStatus } from "@/lib/types"

export type SortConfig = {
    key: keyof Invoice
    direction: "asc" | "desc"
} | null

export type InvoiceStatusFilter = "all" | InvoiceStatus

export function useRegulatorInvoices() {
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

    const filteredAndSortedInvoices = useMemo(() => {
        let processed = [...mockInvoices]

        // Filter by Search
        if (search) {
            processed = processed.filter(inv =>
                inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
                (inv.companyName && inv.companyName.toLowerCase().includes(search.toLowerCase()))
            )
        }

        // Filter by Status
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
