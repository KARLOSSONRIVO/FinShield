import { useQuery } from "@tanstack/react-query"
import { DashboardService } from "@/services/dashboard.service"
import { InvoiceService } from "@/services/invoice.service"
import { ListInvoice } from "@/lib/types"

interface UseAuditorDashboardOptions {
    enabled?: boolean;
}

export function useAuditorDashboard({ enabled = true }: UseAuditorDashboardOptions = {}) {
    const { data: allInvoices = [], isLoading } = useQuery({
        queryKey: ["invoices"],
        queryFn: async () => {
            // Fetch all invoices for real-time dashboard stats calculation without limits
            const res = await InvoiceService.list()
            return res.data?.items ?? []
        },
        enabled
    })

    // Filter relevant lists for display
    const pendingReviews = allInvoices.filter((i: ListInvoice) => i.status === "pending")
        .sort((a: ListInvoice, b: ListInvoice) => new Date(a.invoiceDate ?? 0).getTime() - new Date(b.invoiceDate ?? 0).getTime())

    const flaggedInvoices = allInvoices.filter((i: ListInvoice) =>
        i.status === "flagged" ||
        i.aiVerdict?.verdict === "flagged"
    )

    // Calculate real-time stats from the fetched dataset
    const verifiedInvoices = allInvoices.filter((i: ListInvoice) =>
        i.status === "clean" || i.aiVerdict?.verdict === "clean"
    )

    // Legacy structure expected by dashboard boxes
    const legacyStats = [
        { label: "Pending Reviews", value: pendingReviews.length, change: "+0", trend: "up" },
        { label: "Flagged Invoices", value: flaggedInvoices.length, change: "+0", trend: "down" },
        { label: "Verified Invoices", value: verifiedInvoices.length, change: "+0", trend: "up" },
        { label: "Total Audited", value: allInvoices.length, change: "+0", trend: "up" },
    ]

    return {
        stats: legacyStats,
        pendingReviews,
        flaggedInvoices,
        isLoading
    }
}
