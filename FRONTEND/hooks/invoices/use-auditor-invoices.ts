"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import type { Invoice } from '@/types'
import { InvoiceService } from "@/services/invoice.service"

export type InvoiceStatusFilter = "all" | "pending" | "verified" | "flagged" | "fraudulent"

export type SortConfig = {
    key: keyof Invoice
    direction: 'asc' | 'desc'
}

export function useAuditorInvoices(initialData?: Invoice[]) {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: "invoiceDate",
        direction: "desc"
    })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)

    const { data: fetchedInvoices = [], isLoading } = useQuery({
        queryKey: ["invoices"],
        queryFn: InvoiceService.getAll,
        enabled: !initialData
    })

    const invoices = initialData || fetchedInvoices

    const filteredAndSortedInvoices = useMemo(() => {
        let result = [...invoices]

        
        if (search) {
            const lowerSearch = search.toLowerCase()
            result = result.filter(invoice =>
                (invoice.invoiceNo && invoice.invoiceNo.toLowerCase().includes(lowerSearch)) ||
                (invoice.companyName && invoice.companyName.toLowerCase().includes(lowerSearch)) ||
                (invoice.totals_total && invoice.totals_total.toString().includes(lowerSearch))
            )
        }

        
        if (statusFilter !== "all") {
            result = result.filter(invoice => {
                const status = invoice.status.toLowerCase()
                const verdict = (invoice.ai_verdict || "").toLowerCase()

                if (statusFilter === "pending") return status === "pending"
                if (statusFilter === "verified") return status === "verified"
                if (statusFilter === "flagged") return status === "flagged" || verdict === "flagged"
                if (statusFilter === "fraudulent") return status === "fraudulent" || verdict === "fraudulent"
                return true
            })
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
    }, [invoices, search, statusFilter, sortConfig])

    const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedInvoices = filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage)

    const handleSort = (key: keyof Invoice) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
        }))
    }

    const requestSort = handleSort

    return {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        sortConfig,
        handleSort,
        requestSort,
        invoices: paginatedInvoices,
        currentPage,
        totalPages,
        setCurrentPage,
        isLoading
    }
}
