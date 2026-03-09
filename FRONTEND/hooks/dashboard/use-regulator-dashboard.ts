import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"

interface UseRegulatorDashboardOptions {
    enabled?: boolean;
}

export function useRegulatorDashboard({ enabled = true }: UseRegulatorDashboardOptions = {}) {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ["regulator-stats"],
        queryFn: DashboardService.getRegulatorStats,
        enabled
    })

    const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
        queryKey: ["invoices"],
        queryFn: async () => {
            const response = await InvoiceService.list()
            return response.data?.items || []
        },
        enabled
    })

    // Count unique companies based on company name or orgId
    const companiesSet = new Set<string>()
    invoices.forEach((inv: any) => {
        if (inv.companyName) companiesSet.add(inv.companyName)
    })

    // Calculate total value
    const totalValue = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.amount || inv.totalAmount) || 0), 0)

    // Calculate flagged invoices (pending or rejected review, or flagged by AI)
    const flaggedCount = invoices.filter((inv: any) =>
        inv.status === "flagged" ||
        inv.aiVerdict?.verdict === "flagged"
    ).length

    // Calculate verified on chain
    const verifiedOnChain = invoices.filter((inv: any) =>
        inv.status === "anchored" ||
        inv.blockchain?.txHash ||
        inv.blockchain?.anchoredAt ||
        inv.blockchain_txHash ||
        (typeof inv.blockchain === 'string' && inv.blockchain.length > 0)
    ).length

    const recentInvoices = invoices.slice(-5).reverse()

    return {
        companiesCount: companiesSet.size,
        verifiedOnChain,
        totalValue,
        flaggedCount,
        recentInvoices,
        totalInvoices: invoices.length,
        isLoading: statsLoading || invoicesLoading
    }
}