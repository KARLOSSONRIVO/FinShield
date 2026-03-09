"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { useUrlPagination } from "@/hooks/common/use-url-pagination"
import { Invoice } from "@/lib/types"

export function useEmployeeFlaggedQueue() {
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

    // Fetch Invoices from API (Employee scoped)
    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ["employee-flagged-invoices", queryParams],
        queryFn: () => InvoiceService.myInvoices({
            ...queryParams,
            limit: 100 // Fetch a larger batch to filter client-side if needed
        })
    })

    const allInvoices = response?.data?.items || []

    // Implementation of "strictly flagged or flagged"
    const filteredInvoices = useMemo(() => {
        return allInvoices.filter((inv: any) => {
            const verdict = inv.aiVerdict?.verdict?.toLowerCase()
            return verdict === "flagged" || inv.status === "flagged"
        })
    }, [allInvoices])

    // Manual client-side filtering and sorting for the filtered set
    const processedInvoices = useMemo(() => {
        let processed = [...filteredInvoices]

        // Search filter - only search by invoice number
        if (search && search.trim()) {
            processed = processed.filter(inv =>
                inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase())
            )
        }

        return processed
    }, [filteredInvoices, search])

    // Pagination for the processed set
    const itemsPerPage = 8
    const totalPages = Math.max(1, Math.ceil(processedInvoices.length / itemsPerPage))
    // Ensure page is within bounds
    const validPage = Math.min(page, totalPages)
    const currentInvoices = processedInvoices.slice((validPage - 1) * itemsPerPage, validPage * itemsPerPage)

    return {
        search,
        setSearch,
        invoices: currentInvoices,
        currentPage: validPage,
        totalPages,
        setCurrentPage: setPage,
        sortConfig: sortBy ? { key: sortBy as keyof Invoice, direction: (order || "asc") as "asc" | "desc" } : null,
        requestSort: setSort,
        isLoading,
        isError,
        error: error ? (error as any).message : null
    }
}