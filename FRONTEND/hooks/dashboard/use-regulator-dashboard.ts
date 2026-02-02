import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"

export function useRegulatorDashboard() {

    const { data: stats } = useQuery({
        queryKey: ["regulator-stats"],
        queryFn: DashboardService.getRegulatorStats
    })

    const { data: logs = [] } = useQuery({
        queryKey: ["recent-logs"],
        queryFn: DashboardService.getRecentLogs
    })

    const { data: invoices = [] } = useQuery({
        queryKey: ["invoices"],
        queryFn: InvoiceService.getAll
    })

    const recentInvoices = invoices.slice(-5).reverse()
    const recentLogs = logs // Already sliced by service

    return {
        companiesCount: stats?.companiesCount || 0,
        verifiedOnChain: stats?.verifiedOnChain || 0,
        totalValue: stats?.totalValue || 0,
        fraudulentCount: stats?.fraudulentCount || 0,
        recentLogs,
        recentInvoices,
        totalInvoices: stats?.activeInvoices || 0
    }
}
