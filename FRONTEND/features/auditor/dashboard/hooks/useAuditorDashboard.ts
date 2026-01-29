import { AUDITOR_DASHBOARD_DATA, MOCK_AUDITOR_INVOICES } from "@/hooks/mock-data"

export function useAuditorDashboard() {
    return {
        stats: AUDITOR_DASHBOARD_DATA,
        pendingReviews: MOCK_AUDITOR_INVOICES
            .filter(i => i.status === "Pending")
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        flaggedInvoices: MOCK_AUDITOR_INVOICES.filter(i => i.status === "Flagged" || i.status === "Fraud"),
    }
}
