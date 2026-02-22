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
        // Fetch real data where possible, partial mocks for missing endpoints
        try {
            const [usersResponse, orgsResponse] = await Promise.all([
                import("./user.service").then(m => m.UserService.listUsers()),
                import("./organization.service").then(m => m.OrganizationService.listOrganizations())
            ])

            const users = Array.isArray(usersResponse.data) ? usersResponse.data : ((usersResponse.data as any)?.items || [])
            const orgs = Array.isArray(orgsResponse.data) ? orgsResponse.data : ((orgsResponse.data as any)?.items || [])
            const invoices: any[] = [] // Still mocked

            return {
                totalRevenue: invoices.reduce((acc, curr) => acc + (curr.totals_total || 0), 0),
                activeInvoices: invoices.length,
                flaggedInvoices: invoices.filter((i) => i.ai_verdict === "flagged").length,
                verifiedInvoices: invoices.filter((i) => i.status === "verified").length,
                totalUsers: users.length,
                totalCompanies: orgs.length
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error)
            // Fallback to strict mocks if API fails
            return {
                totalRevenue: 0,
                activeInvoices: 0,
                flaggedInvoices: 0,
                verifiedInvoices: 0,
                totalUsers: 0,
                totalCompanies: 0
            }
        }
    },

    /**
     * Get recent audit logs
     */
    getRecentLogs: async () => {
        await new Promise(resolve => setTimeout(resolve, 400))
        return []
    },

    getCompanyStats: async (): Promise<DashboardStats> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return {
            totalRevenue: 0,
            activeInvoices: 0,
            flaggedInvoices: 0,
            verifiedInvoices: 0
        }
    },

    getAuditorStats: async (): Promise<DashboardStats> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        return {
            totalRevenue: 0,
            activeInvoices: 0,
            flaggedInvoices: 0,
            verifiedInvoices: 0,
            pendingReviews: 0
        }
    },

    getRegulatorStats: async (): Promise<DashboardStats> => {
        await new Promise(resolve => setTimeout(resolve, 500))
        const invoices: any[] = []
        return {
            totalRevenue: 0,
            activeInvoices: invoices.length,
            flaggedInvoices: 0, // Not used directly
            verifiedInvoices: 0, // Not used directly
            companiesCount: 0,
            verifiedOnChain: invoices.filter(i => i.blockchain_txHash).length,
            totalValue: invoices.reduce((sum, inv) => sum + (inv.totals_total ?? 0), 0),
            fraudulentCount: invoices.filter(i => i.status === "fraudulent").length
        }
    }
}
