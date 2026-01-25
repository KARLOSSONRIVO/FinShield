"use client"

import { useState } from "react"
import { mockInvoices } from "@/lib/mock-data"

export type InvoiceStatusFilter = "all" | "pending" | "verified" | "flagged" | "fraudulent"

export function useRegulatorInvoices() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")

    const filteredInvoices = mockInvoices.filter((inv) => {
        const matchesSearch =
            inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
            inv.companyName?.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === "all" || inv.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return {
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        filteredInvoices
    }
}
