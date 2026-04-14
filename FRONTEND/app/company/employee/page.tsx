import { CompanySidebar } from "@/components/company-sidebar"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockInvoices } from "@/lib/mock-data"
import { User, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"

export default function EmployeeDashboard() {
  // Filter invoices for this specific employee (John Doe - user-employee-1)
  const myInvoices = mockInvoices.filter((i) => i.uploadedByUserId === "user-employee-1")
  const flaggedInvoices = myInvoices.filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
  const pendingInvoices = myInvoices.filter((i) => i.status === "pending")
  const verifiedInvoices = myInvoices.filter((i) => i.status === "verified")
  const totalValue = myInvoices.reduce((sum, inv) => sum + inv.totals_total, 0)
  const recentInvoices = myInvoices.slice(-5).reverse()

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_USER" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Employee Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back, John Doe</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="My Invoices"
              value={myInvoices.length}
              icon={FileText}
              description={`$${totalValue.toLocaleString()} total`}
            />
            <StatsCard
              title="Pending Review"
              value={pendingInvoices.length}
              icon={Clock}
              description="Awaiting auditor"
            />
            <StatsCard
              title="Verified"
              value={verifiedInvoices.length}
              icon={CheckCircle}
              description="Approved invoices"
            />
            <StatsCard
              title="Flagged"
              value={flaggedInvoices.length}
              icon={AlertTriangle}
              description="Requires attention"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Recent Invoices
                </CardTitle>
                <CardDescription>Your latest submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.length > 0 ? (
                    recentInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                          <InvoiceStatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No invoices uploaded yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Alerts
                </CardTitle>
                <CardDescription>Invoices requiring your attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {flaggedInvoices.length > 0 ? (
                    flaggedInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border-l-2 border-warning"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No alerts at this time</p>
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
