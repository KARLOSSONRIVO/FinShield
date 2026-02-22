"use client"

import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"
import { UserService } from "@/services/user.service"
import { useAuth } from "@/hooks/use-auth"

export function useManagerDashboard() {
    const { user } = useAuth()
    const orgId = user?.organizationId || ""

    // 1. Fetch Stats (Company Manager specific)
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["manager-stats", orgId],
        queryFn: async () => {
            // Ensure we use a company-specific stats endpoint if available.
            // For now mapping to general insights/stats if custom endpoint isn't fully ready
            return DashboardService.getCompanyStats ? DashboardService.getCompanyStats() : null;
        },
        enabled: !!orgId
    })

    // 2. Fetch Recent Invoices for the company
    const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
        queryKey: ["invoices", { companyOrgId: orgId }],
        queryFn: async () => {
            const res = await InvoiceService.getAll({ companyOrgId: orgId, limit: 100 })
            return res.data?.items || []
        },
        enabled: !!orgId
    })

    // 3. Fetch Company Employees
    const { data: employees = [], isLoading: employeesLoading } = useQuery({
        queryKey: ["users", { orgId }],
        queryFn: async () => {
            const res = await UserService.listUsers({ limit: 100 })
            const allUsers = res.data?.items || []
            return allUsers.filter((u: any) => u.role === "COMPANY_USER")
        },
        enabled: !!orgId
    })

    const flaggedInvoices = allInvoices.filter((i: any) => i.status === "flagged" || i.ai_verdict === "flagged")
    const totalValue = allInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.totals_total) || 0), 0)
    const recentInvoices = allInvoices.slice(0, 5)

    const isLoading = statsLoading || invoicesLoading || employeesLoading

    return {
        companyInvoicesCount: allInvoices.length,
        flaggedInvoicesCount: flaggedInvoices.length,
        employeeCount: employees.length,
        totalValue: stats?.totalValue || totalValue,
        recentInvoices,
        flaggedInvoices,
        isLoading
    }
}
