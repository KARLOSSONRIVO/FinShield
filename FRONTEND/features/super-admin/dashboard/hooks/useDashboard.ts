"use client"

import { mockInvoices, mockOrganizations, mockUsers, mockAuditLogs } from "@/lib/mock-data"

export function useDashboard() {
    const companies = mockOrganizations.filter((o) => o.type === "company")
    const flaggedInvoices = mockInvoices.filter((i) => i.status === "flagged" || i.status === "fraudulent")
    const totalValue = mockInvoices.reduce((sum, inv) => sum + inv.totals_total, 0)
    const recentLogs = mockAuditLogs.slice(-5).reverse()
    const recentInvoices = mockInvoices.slice(-5).reverse()
    const totalUsers = mockUsers.length
    const totalInvoices = mockInvoices.length

    return {
        companiesCount: companies.length,
        totalUsers,
        totalInvoices,
        totalValue,
        flaggedCount: flaggedInvoices.length,
        recentLogs,
        recentInvoices
    }
}
