"use client"

import { mockInvoices, mockAssignments } from "@/lib/mock-data"

export function useAuditorFlagged() {
    // Mock logged in auditor
    const currentAuditorId = "user-auditor-1"

    const assignedCompanyIds = mockAssignments
        .filter((a) => a.auditorUserId === currentAuditorId && a.status === "active")
        .map((a) => a.companyOrgId)

    const flaggedInvoices = mockInvoices.filter(
        (i) => assignedCompanyIds.includes(i.companyOrgId) && (i.status === "flagged" || i.ai_verdict === "flagged"),
    )

    return {
        flaggedInvoices
    }
}
