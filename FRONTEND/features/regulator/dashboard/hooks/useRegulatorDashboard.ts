"use client"

import { mockInvoices, mockOrganizations, mockAuditLogs } from "@/lib/mock-data"

export function useRegulatorDashboard() {
    const companies = mockOrganizations.filter((o) => o.type === "company")
    const verifiedOnChain = mockInvoices.filter((i) => i.blockchain_txHash).length
    const totalValue = mockInvoices.reduce((sum, inv) => sum + inv.totals_total, 0)
    const fraudulentCount = mockInvoices.filter((i) => i.status === "fraudulent").length
    const recentLogs = mockAuditLogs.slice(-5).reverse()
    const recentInvoices = mockInvoices.slice(-5).reverse()

    return {
        companiesCount: companies.length,
        verifiedOnChain,
        totalValue,
        fraudulentCount,
        recentLogs,
        recentInvoices,
        totalInvoices: mockInvoices.length
    }
}
