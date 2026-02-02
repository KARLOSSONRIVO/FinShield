import { mockInvoices, mockAuditLogs, mockUsers, mockOrganizations } from "@/lib/mock-data"
import { InvoiceService } from "./invoice.service"

export interface DashboardStats {
    totalRevenue: number
    activeInvoices: number
    flaggedInvoices: number
    verifiedInvoices: number
    totalUsers?: number
    totalCompanies?: number
    pendingReviews?: number
    fraudulentCount?: number
    companiesCount?: number
    verifiedOnChain?: number
    totalValue?: number
}

export const DashboardService = {
    /**
     * Get aggregated stats for Super Admin
     * Simulates GET /dashboard/stats
     */
    getSuperAdminStats: async (): Promise<DashboardStats> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 600))

        const invoices = mockInvoices
        const stats = {
            totalRevenue: invoices.reduce((acc, curr) => acc + curr.totals_total, 0),
            activeInvoices: invoices.length,
            flaggedInvoices: invoices.filter((i) => i.ai_verdict === "flagged").length,
            verifiedInvoices: invoices.filter((i) => i.status === "verified").length,
            totalUsers: mockUsers.length,
            totalCompanies: mockOrganizations.length
        }
        return stats
    },

    /**
     * Get recent audit logs
     */
    getRecentLogs: async () => {
        await new Promise(resolve => setTimeout(resolve, 400))
        return mockAuditLogs.slice(0, 5)
    },

    getAuditorStats: async (): Promise<DashboardStats> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return {
            totalRevenue: 0,
            activeInvoices: mockInvoices.length,
            flaggedInvoices: mockInvoices.filter(i => i.status === "flagged" || i.status === "fraudulent").length,
            verifiedInvoices: mockInvoices.filter(i => i.status === "verified").length,
            pendingReviews: mockInvoices.filter(i => i.status === "pending").length
        }
    },

    getRegulatorStats: async (): Promise<DashboardStats> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        const invoices = mockInvoices
        return {
            totalRevenue: 0,
            activeInvoices: invoices.length,
            flaggedInvoices: 0, // Not used directly
            verifiedInvoices: 0, // Not used directly
            companiesCount: mockOrganizations.filter(o => o.type === "company").length,
            verifiedOnChain: invoices.filter(i => i.blockchain_txHash).length,
            totalValue: invoices.reduce((sum, inv) => sum + inv.totals_total, 0),
            fraudulentCount: invoices.filter(i => i.status === "fraudulent").length
        }
    }
}
