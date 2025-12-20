import { AdminSidebar } from "@/components/admin-sidebar"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockInvoices, mockAssignments } from "@/lib/mock-data"
import { FileSearch, FileText, AlertTriangle, CheckCircle } from "lucide-react"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"

export default function AuditorDashboard() {
  // Auditor 1 is assigned to companies 1 and 2
  const assignedCompanyIds = mockAssignments
    .filter((a) => a.auditorUserId === "user-auditor-1" && a.status === "active")
    .map((a) => a.companyOrgId)

  const assignedInvoices = mockInvoices.filter((i) => assignedCompanyIds.includes(i.companyOrgId))
  const pendingReviews = assignedInvoices.filter((i) => i.status === "pending")
  const flaggedInvoices = assignedInvoices.filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
  const verifiedInvoices = assignedInvoices.filter((i) => i.status === "verified")

  return (
    <div className="flex h-screen">
      <AdminSidebar role="AUDITOR" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSearch className="h-6 w-6 text-primary" />
              Auditor Dashboard
            </h1>
            <p className="text-muted-foreground">Review invoices for your assigned companies</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Assigned Companies"
              value={assignedCompanyIds.length}
              icon={FileSearch}
              description="Active assignments"
            />
            <StatsCard
              title="Pending Reviews"
              value={pendingReviews.length}
              icon={FileText}
              description="Awaiting your decision"
            />
            <StatsCard
              title="Flagged Items"
              value={flaggedInvoices.length}
              icon={AlertTriangle}
              description="Requires attention"
            />
            <StatsCard
              title="Verified"
              value={verifiedInvoices.length}
              icon={CheckCircle}
              description="Completed reviews"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Pending Reviews
                </CardTitle>
                <CardDescription>Invoices awaiting your decision</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReviews.length > 0 ? (
                    pendingReviews.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                          <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No pending reviews</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Flagged Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Flagged Items
                </CardTitle>
                <CardDescription>High-risk invoices requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flaggedInvoices.length > 0 ? (
                    flaggedInvoices.slice(0, 5).map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border-l-2 border-warning"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                          <InvoiceStatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No flagged items</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
