"use client"

import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"
import { UserService } from "@/services/user.service"
import { useAuth } from "@/hooks/global/use-auth"

interface UseManagerDashboardOptions {
    enabled?: boolean;
}

export function useManagerDashboard({ enabled = true }: UseManagerDashboardOptions = {}) {
    const { user } = useAuth()
    const orgId = user?.organizationId || (user as any)?.orgId || ""

    // 1. Fetch Stats (Company Manager specific)
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["manager-stats", orgId],
        queryFn: async () => {
            // Ensure we use a company-specific stats endpoint if available.
            // For now mapping to general insights/stats if custom endpoint isn't fully ready
            return DashboardService.getCompanyStats ? DashboardService.getCompanyStats() : null;
        },
        enabled: enabled && !!orgId
    })

    // 2. Fetch Recent Invoices for the company
    const { data: allInvoices = [], isLoading: invoicesLoading } = useQuery({
        queryKey: ["invoices", { companyOrgId: orgId }],
        queryFn: async () => {
            const res = await InvoiceService.list()
            return res.data?.items || []
        },
        enabled: enabled && !!orgId
    })

    // 3. Fetch Company Employees
    const { data: employees = [], isLoading: employeesLoading } = useQuery({
        queryKey: ["users", { orgId }],
        queryFn: async () => {
            const res = await UserService.listEmployees()
            return res.data?.items || []
        },
        enabled: enabled && !!orgId
    })

    const now = new Date()
    const thisMonthInvoices = allInvoices.filter((inv: any) => {
        const dateStr = inv.blockchain?.anchoredAt || inv.anchoredAt || inv.createdAt || inv.uploadedAt || inv.invoiceDate || inv.date
        if (!dateStr) return false
        const d = new Date(dateStr)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const allFlaggedInvoices = allInvoices
        .filter((i: any) => i.status === "flagged" || i.aiVerdict?.verdict === "flagged")
        .sort((a: any, b: any) => {
            const dateStrA = a.createdAt || a.invoiceDate || a.date || a.uploadedAt
            const dateStrB = b.createdAt || b.invoiceDate || b.date || b.uploadedAt
            const dateA = dateStrA ? new Date(dateStrA).getTime() : 0
            const dateB = dateStrB ? new Date(dateStrB).getTime() : 0
            return dateB - dateA
        })

    const flaggedInvoices = allFlaggedInvoices.slice(0, 4)
    const totalValue = thisMonthInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount || inv.totalAmount) || 0), 0)

    // Sort strictly by anchoredAt descending to show most recently verified invoices
    const recentInvoices = [...allInvoices]
        .sort((a: any, b: any) => {
            const dateStrA = a.blockchain?.anchoredAt || a.anchoredAt;
            const dateStrB = b.blockchain?.anchoredAt || b.anchoredAt;
            const dateA = dateStrA ? new Date(dateStrA).getTime() : 0;
            const dateB = dateStrB ? new Date(dateStrB).getTime() : 0;
            return dateB - dateA; // Descending order
        })
        .slice(0, 4)

    const isLoading = statsLoading || invoicesLoading || employeesLoading

    return {
        companyInvoicesCount: thisMonthInvoices.length,
        flaggedInvoicesCount: allFlaggedInvoices.length,
        employeeCount: employees.length,
        totalValue: stats?.totalValue || totalValue,
        recentInvoices,
        flaggedInvoices,
        isLoading
    }
}
