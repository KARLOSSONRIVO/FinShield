"use client"

import { useState } from "react"
import { mockInvoices, mockAssignments } from "@/lib/mock-data"

export type InvoiceStatusFilter = "all" | "pending" | "verified" | "flagged" | "fraudulent"

export function useAuditorInvoices() {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")

    // Mock logged in auditor
    const currentAuditorId = "user-auditor-1"

    // Get assigned companies for auditor
    const assignedCompanyIds = mockAssignments
        .filter((a) => a.auditorUserId === currentAuditorId && a.status === "active")
        .map((a) => a.companyOrgId)

    const assignedInvoices = mockInvoices.filter((i) => assignedCompanyIds.includes(i.companyOrgId))

    const filteredInvoices = assignedInvoices.filter((inv) => {
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
