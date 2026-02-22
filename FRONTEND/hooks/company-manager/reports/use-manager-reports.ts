"use client"

export function useManagerReports() {
    const companyInvoices: any[] = []

    const totalValue = companyInvoices.reduce((sum, inv) => sum + (inv.totals_total ?? 0), 0)

    const verifiedValue = companyInvoices
        .filter((i) => i.status === "verified")
        .reduce((sum, inv) => sum + (inv.totals_total ?? 0), 0)

    const flaggedValue = companyInvoices
        .filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
        .reduce((sum, inv) => sum + (inv.totals_total ?? 0), 0)

    const fraudulentValue = companyInvoices
        .filter((i) => i.status === "fraudulent")
        .reduce((sum, inv) => sum + (inv.totals_total ?? 0), 0)

    const statusCounts = {
        verified: companyInvoices.filter((i) => i.status === "verified").length,
        pending: companyInvoices.filter((i) => i.status === "pending").length,
        flagged: companyInvoices.filter((i) => i.status === "flagged").length,
        fraudulent: companyInvoices.filter((i) => i.status === "fraudulent").length,
    }

    const averageRiskScore = companyInvoices.length > 0
        ? companyInvoices.reduce((sum, inv) => sum + (inv.ai_riskScore ?? 0), 0) / companyInvoices.length
        : 0

    const cleanCount = companyInvoices.filter((i) => i.ai_verdict === "clean").length
    const aiFlaggedCount = companyInvoices.filter((i) => i.ai_verdict === "flagged").length

    const fraudRate = companyInvoices.length > 0
        ? (statusCounts.fraudulent / companyInvoices.length) * 100
        : 0

    return {
        invoices: companyInvoices,
        totalCount: companyInvoices.length,
        metrics: {
            totalValue,
            verifiedValue,
            flaggedValue,
            fraudulentValue
        },
        statusCounts,
        riskMetrics: {
            averageRiskScore,
            cleanCount,
            aiFlaggedCount,
            fraudRate,
            fraudCount: statusCounts.fraudulent
        }
    }
}
