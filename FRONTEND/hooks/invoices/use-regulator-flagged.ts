"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"
import { Invoice } from "@/lib/types"

export function useRegulatorFlaggedInvoices() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null)

    const { data: rawInvoices = [], isLoading } = useQuery({
        queryKey: ["regulator-flagged-queue"],
        queryFn: async () => {
            const res = await InvoiceService.list({ limit: 100 })
            return res.data?.items ?? []
        }
    })

    const requestSort = (key: string) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    // Base Set: Invoices that are AI Flagged or have pending review
    const flaggedInvoices = useMemo(() => {
        return rawInvoices.filter((inv: any) =>
            inv.status === "flagged" ||
            inv.aiVerdict?.verdict === "flagged" ||
            inv.reviewDecision === "pending"
        )
    }, [rawInvoices])

    const filteredAndSortedInvoices = useMemo(() => {
        let processed = [...flaggedInvoices]

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            processed = processed.filter(inv =>
                (inv.invoiceNo || inv.invoiceNumber || "").toLowerCase().includes(lowerSearch) ||
                (inv.companyName && inv.companyName.toLowerCase().includes(lowerSearch)) ||
                ((inv as any).organizationName && (inv as any).organizationName.toLowerCase().includes(lowerSearch)) ||
                ((inv as any).organizationId && typeof (inv as any).organizationId === 'string' && (inv as any).organizationId.toLowerCase().includes(lowerSearch))
            )
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a]
                const bValue = b[sortConfig.key as keyof typeof b]

                if (aValue === bValue) return 0
                if (aValue === undefined || aValue === null) return 1
                if (bValue === undefined || bValue === null) return -1

                if (sortConfig.key === 'invoiceDate' || sortConfig.key === 'createdAt' || sortConfig.key === 'date' || sortConfig.key === 'uploadedAt') {
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
    }, [flaggedInvoices, search, sortConfig])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredAndSortedInvoices.length / itemsPerPage))

    // Safety check for out of bounds
    const validPage = Math.min(currentPage, totalPages)
    if (currentPage > validPage && validPage > 0) {
        setCurrentPage(validPage)
    }

    const startIndex = (validPage - 1) * itemsPerPage
    const currentInvoices = filteredAndSortedInvoices.slice(startIndex, startIndex + itemsPerPage)

    return {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,

        invoices: currentInvoices,
        currentPage: validPage,
        totalPages,
        setCurrentPage,

        sortConfig,
        requestSort,
        isLoading
    }
}
