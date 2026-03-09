"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"
import { Invoice } from "@/lib/types"

export function useFlaggedQueue() {
    const {
        page,
        search,
        setSearch,
        queryParams,
        setPage,
        sortBy,
        order,
        setSort
    } = useUrlPagination(8)

    const [statusFilter, setStatusFilter] = useState("all")

    // Fetch invoices with current URL params (page, search, sort)
    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ["flagged-invoices", queryParams],
        queryFn: () => InvoiceService.list({ ...queryParams })
    })

    const allInvoices = response?.data?.items || []

    // Apply business logic: flagged/pending verdict, exclude accepted/rejected
    const filteredInvoices = useMemo(() => {
        return allInvoices.filter(inv => {
            const verdict = inv.aiVerdict?.verdict?.toLowerCase()
            const status = inv.status?.toLowerCase()

            const isValidVerdict = verdict === "flagged" || verdict === "pending"
            const isExcludedStatus = status === "accepted" || status === "rejected"

            return isValidVerdict && !isExcludedStatus
        })
    }, [allInvoices])

    // Apply optional status dropdown filter
    const processedInvoices = useMemo(() => {
        let processed = [...filteredInvoices]
        if (statusFilter !== "all") {
            processed = processed.filter(inv => inv.status === statusFilter)
        }
        return processed
    }, [filteredInvoices, statusFilter])

    // Paginate the processed list (client‑side)
    const itemsPerPage = 8
    const totalPages = Math.max(1, Math.ceil(processedInvoices.length / itemsPerPage))
    const currentInvoices = processedInvoices.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    )

    return {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,

        invoices: currentInvoices,
        currentPage: page,
        totalPages,
        setCurrentPage: setPage,

        sortConfig: sortBy ? { key: sortBy as keyof Invoice, direction: (order || "asc") as "asc" | "desc" } : null,
        requestSort: setSort,
        isLoading,
        isError,
        error: error ? (error as any).message : null
    }
}