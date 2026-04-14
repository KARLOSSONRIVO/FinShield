import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"
import { OrganizationService } from "@/services/organization.service"
import { UserService } from "@/services/user.service"

interface UseSuperAdminDashboardOptions {
    enabled?: boolean;
}

export function useSuperAdminDashboard({ enabled = true }: UseSuperAdminDashboardOptions = {}) {
    // 1. Fetch Orgs count
    const { data: orgsResponse, isLoading: orgsLoading } = useQuery({
        queryKey: ["orgs-count"],
        queryFn: () => OrganizationService.listOrganizations({ limit: 1 }),
        enabled
    })

    // 2. Fetch Users count
    const { data: usersResponse, isLoading: usersLoading } = useQuery({
        queryKey: ["users-count"],
        queryFn: () => UserService.listUsers({ limit: 1 }),
        enabled
    })

    // 3. Fetch Recent Invoices via GET /invoice/list
    const { data: invoicesResponse, isLoading: invoicesLoading } = useQuery({
        queryKey: ["dashboard-invoices"],
        queryFn: () => InvoiceService.list({ limit: 100, sortBy: "createdAt", order: "desc" }),
        enabled
    })

    // 4. Fetch Recent Logs
    const { data: logs = [], isLoading: logsLoading } = useQuery({
        queryKey: ["dashboard-logs"],
        queryFn: DashboardService.getRecentLogs,
        enabled
    })

    const allInvoices = invoicesResponse?.data?.items || []
    const totalInvoices = invoicesResponse?.data?.pagination?.total || 0

    // Strictly flagged or flagged
    const flaggedCount = allInvoices.filter(i => {
        const v = i.aiVerdict?.verdict?.toLowerCase()
        return v === "flagged" || v === "flagged"
    }).length
    const totalValue = allInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)
    const recentInvoices = allInvoices.slice(0, 5)

    const loading = orgsLoading || usersLoading || invoicesLoading || logsLoading

    return {
        invoices: allInvoices,
        logs,
        loading,
        companiesCount: orgsResponse?.data?.pagination?.total || 0,
        totalUsers: usersResponse?.data?.pagination?.total || 0,
        totalInvoices,
        totalValue,
        flaggedCount,
        recentLogs: logs,
        recentInvoices
    }
}
