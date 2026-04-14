"use client"

import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"

export function useManagerReports() {
    const { data: companyInvoices = [], isLoading } = useQuery({
        queryKey: ["invoices", "manager-all"],
        queryFn: async () => {
            const res = await InvoiceService.list({ limit: 100 })
            return res.data?.items || []
        }
    })

    const totalValue = companyInvoices.reduce((sum, inv) => sum + (Number(inv.amount || inv.totalAmount) || 0), 0)

    const verifiedValue = companyInvoices
        .filter((i) =>
            String(i.reviewDecision) === "approved" ||
            (String(i.reviewDecision) !== "rejected" && (i.aiVerdict?.verdict === "clean" || (!i.aiVerdict?.verdict && String(i.status) !== "flagged" && String(i.status) !== "rejected")))
        )
        .reduce((sum, inv) => sum + (Number(inv.amount || inv.totalAmount) || 0), 0)

    const flaggedValue = companyInvoices
        .filter((i) =>
            String(i.reviewDecision) === "rejected" ||
            (String(i.reviewDecision) !== "approved" && (String(i.status) === "flagged" || i.aiVerdict?.verdict === "flagged" || String(i.status) === "rejected"))
        )
        .reduce((sum, inv) => sum + (Number(inv.amount || inv.totalAmount) || 0), 0)

    const statusCounts = {
        approved: companyInvoices.filter((i) =>
            String(i.status) === "approved" ||
            String(i.reviewDecision) === "approved"
        ).length,
        rejected: companyInvoices.filter((i) =>
            String(i.status) === "rejected" ||
            String(i.reviewDecision) === "rejected"
        ).length,
        pending: companyInvoices.filter((i) =>
            String(i.status) !== "approved" &&
            String(i.reviewDecision) !== "approved" &&
            String(i.status) !== "rejected" &&
            String(i.reviewDecision) !== "rejected"
        ).length,
    }

    const averageRiskScore = companyInvoices.length > 0
        ? companyInvoices.reduce((sum, inv) => sum + (Number(inv.aiVerdict?.riskScore) || 0), 0) / companyInvoices.length
        : 0

    const verifiedCount = companyInvoices.filter((i) => i.aiVerdict?.verdict === "clean").length
    const aiFlaggedCount = companyInvoices.filter((i) => i.aiVerdict?.verdict === "flagged").length

    const fraudCount = companyInvoices.filter((i) =>
        (String(i.status) === "flagged" || i.aiVerdict?.verdict === "flagged") &&
        String(i.reviewDecision) !== "approved" &&
        String(i.reviewDecision) !== "rejected"
    ).length

    const fraudRate = companyInvoices.length > 0
        ? (fraudCount / companyInvoices.length) * 100
        : 0

    return {
        invoices: companyInvoices,
        totalCount: companyInvoices.length,
        metrics: {
            totalValue,
            verifiedValue,
            flaggedValue,
        },
        statusCounts,
        riskMetrics: {
            averageRiskScore,
            verifiedCount,
            aiFlaggedCount,
            fraudRate,
            fraudCount
        },
        isLoading
    }
}
