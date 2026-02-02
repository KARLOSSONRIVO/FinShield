import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"

export function useAuditorDashboard() {
    const { data: stats } = useQuery({
        queryKey: ["auditor-stats"],
        queryFn: DashboardService.getAuditorStats
    })

    const { data: allInvoices = [] } = useQuery({
        queryKey: ["invoices"],
        queryFn: InvoiceService.getAll
    })

    // Filter relevant lists
    const pendingReviews = allInvoices.filter(i => i.status === "pending")
        .sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime())

    const flaggedInvoices = allInvoices.filter(i => i.status === "flagged" || i.status === "fraudulent")

    // Legacy structure expected by dashboard
    const legacyStats = [
        { label: "Pending Reviews", value: stats?.pendingReviews || 0, change: "+5", trend: "up" },
        { label: "Flagged Invoices", value: stats?.flaggedInvoices || 0, change: "-2", trend: "down" },
        { label: "Verified Invoices", value: stats?.verifiedInvoices || 0, change: "+12", trend: "up" },
        { label: "Total Audited", value: stats?.activeInvoices || 0, change: "+8", trend: "up" },
    ]

    return {
        stats: legacyStats,
        pendingReviews,
        flaggedInvoices,
    }
}
