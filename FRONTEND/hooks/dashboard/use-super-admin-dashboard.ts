import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"

export function useSuperAdminDashboard() {
    
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: DashboardService.getSuperAdminStats
    })

    
    const { data: logs = [], isLoading: logsLoading } = useQuery({
        queryKey: ["dashboard-logs"],
        queryFn: DashboardService.getRecentLogs
    })

    
    const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
        queryKey: ["invoices"],
        queryFn: InvoiceService.getAll
    })

    const loading = statsLoading || logsLoading || invoicesLoading
    const recentInvoices = allInvoices.slice(0, 5)

    return {
        
        invoices: allInvoices,
        logs,
        stats: stats || {
            totalRevenue: 0,
            activeInvoices: 0,
            flaggedInvoices: 0,
            verifiedInvoices: 0
        },
        loading,

        
        companiesCount: stats?.totalCompanies || 0,
        totalUsers: stats?.totalUsers || 0,
        totalInvoices: stats?.activeInvoices || 0, 
        totalValue: stats?.totalRevenue || 0,
        flaggedCount: stats?.flaggedInvoices || 0,
        recentLogs: logs,
        recentInvoices
    }
}
