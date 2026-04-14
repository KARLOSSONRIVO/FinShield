"use client"

import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { MyInvoice } from "@/lib/types"

interface UseEmployeeDashboardOptions {
    enabled?: boolean;
}

export function useEmployeeDashboard({ enabled = true }: UseEmployeeDashboardOptions = {}) {
    const { data, isLoading } = useQuery({
        queryKey: ["invoices", "employee-dashboard"],
        queryFn: async () => {
            const response = await InvoiceService.myInvoices({
                limit: 100 // Fetch enough for dashboard stats
            })
            // Return the actual data structure from the service
            return response.data // This should be { items, pagination }
        },
        enabled
    })

    // Access the items directly from the response
    const allInvoices = (data as any)?.items || []

    // Calculate ALL-TIME stats from the entire dataset (no month filtering)
    const totalInvoicesCount = allInvoices.length

    const pendingCount = allInvoices.filter((i: MyInvoice) =>
        String(i.status) === "pending"
    ).length

    const verifiedCount = allInvoices.filter((i: MyInvoice) =>
        String(i.status) === "approved" || String(i.status) === "clean" || String((i as any).reviewDecision) === "approved"
    ).length

    const rejectedCount = allInvoices.filter((i: MyInvoice) =>
        String(i.status) === "rejected" || String(i.status) === "flagged"
    ).length

    // Sort by uploadedAt for recent invoices (most recent first) - with safe date handling
    const sortedByUpload = [...allInvoices].sort((a: MyInvoice, b: MyInvoice) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
        return dateB - dateA
    })

    // Get recent invoices (last 5 by upload date)
    const recentInvoices = sortedByUpload.slice(0, 5)

    // Get rejected invoices
    const rejectedInvoices = allInvoices
        .filter((i: MyInvoice) =>
            String(i.status) === "rejected" || String(i.status) === "flagged"
        )
        .sort((a: MyInvoice, b: MyInvoice) => {
            const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
            const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
            return dateB - dateA
        })
        .slice(0, 5)

    return {
        myInvoicesCount: totalInvoicesCount,
        pendingCount,
        verifiedCount,
        rejectedCount,
        recentInvoices,
        rejectedInvoices,
        isLoading
    }
}
