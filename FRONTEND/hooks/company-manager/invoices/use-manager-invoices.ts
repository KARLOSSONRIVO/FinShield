"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Invoice } from "@/lib/types"
import { InvoiceService } from "@/services/invoice.service"

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
    const itemsPerPage = 7

    const { data: allInvoices = [], isLoading } = useQuery({
        queryKey: ["invoices"],
        queryFn: InvoiceService.getAll
    })

    // Manager only sees their own company invoices
    // TODO: In real app, API handles this. For now using mock service returning all.
    const companyInvoices = useMemo(
        () => allInvoices.filter((i) => i.companyOrgId === "org-company-1"),
        [allInvoices]
    )

    const filteredAndSortedInvoices = useMemo(() => {
        let result = [...companyInvoices]

        // 1. Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            result = result.filter(invoice =>
                invoice.invoiceNo.toLowerCase().includes(lowerSearch) ||
                (invoice.companyName || "").toLowerCase().includes(lowerSearch) ||
                invoice.totals_total.toString().includes(lowerSearch)
            )
        }

        // 2. Status Filter
        if (statusFilter !== "all") {
            result = result.filter(invoice => {
                const status = invoice.status.toLowerCase()
                return status === statusFilter
            })
        }

        // 3. Sorting
        result.sort((a, b) => {
            const aValue = a[sortConfig.key]
            const bValue = b[sortConfig.key]

            // Handle undefined values
            if (aValue === undefined && bValue === undefined) return 0
            if (aValue === undefined) return 1
            if (bValue === undefined) return -1

            if (aValue < bValue) {
                return sortConfig.direction === "asc" ? -1 : 1
            }
            if (aValue > bValue) {
                return sortConfig.direction === "asc" ? 1 : -1
            }
            return 0
        })

        return result
    }, [search, statusFilter, sortConfig, companyInvoices])

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
    }
}
