import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"

export function useSuperAdminDashboard() {
    // 1. Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: DashboardService.getSuperAdminStats
    })

    // 2. Fetch Recent Logs
    const { data: logs = [], isLoading: logsLoading } = useQuery({
        queryKey: ["dashboard-logs"],
        queryFn: DashboardService.getRecentLogs
    })

    // 3. Fetch Recent Invoices (using existing service)
    const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
        queryKey: ["invoices"],
        queryFn: InvoiceService.getAll
    })

    const loading = statsLoading || logsLoading || invoicesLoading
    const recentInvoices = allInvoices.slice(0, 5)

    return {
        // Expose raw data if needed
        invoices: allInvoices,
        logs,
        stats: stats || {
            totalRevenue: 0,
            activeInvoices: 0,
            flaggedInvoices: 0,
            verifiedInvoices: 0
        },
        loading,

        // Flat exports for Dashboard Component
        companiesCount: stats?.totalCompanies || 0,
        totalUsers: stats?.totalUsers || 0,
        totalInvoices: stats?.activeInvoices || 0, // Using active as total for now
        totalValue: stats?.totalRevenue || 0,
        flaggedCount: stats?.flaggedInvoices || 0,
        recentLogs: logs,
        recentInvoices
    }
}
