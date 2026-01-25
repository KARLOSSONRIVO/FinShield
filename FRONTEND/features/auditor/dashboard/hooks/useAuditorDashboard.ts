"use client"

import { mockInvoices, mockAssignments } from "@/lib/mock-data"

export function useAuditorDashboard() {
    // Mock logged in auditor
    const currentAuditorId = "user-auditor-1"

    const assignedCompanyIds = mockAssignments
        .filter((a) => a.auditorUserId === currentAuditorId && a.status === "active")
        .map((a) => a.companyOrgId)

    const assignedInvoices = mockInvoices.filter((i) => assignedCompanyIds.includes(i.companyOrgId))
    const pendingReviews = assignedInvoices.filter((i) => i.status === "pending")
    const flaggedInvoices = assignedInvoices.filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
    const verifiedInvoices = assignedInvoices.filter((i) => i.status === "verified")

    return {
        assignedCompanyIds,
        pendingReviews,
        flaggedInvoices,
        verifiedInvoices
    }
}
