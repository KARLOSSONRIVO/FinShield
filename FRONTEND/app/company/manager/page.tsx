import { CompanySidebar } from "@/components/company-sidebar"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockInvoices, mockUsers } from "@/lib/mock-data"
import { Building2, FileText, AlertTriangle, Users, TrendingUp } from "lucide-react"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"

export default function CompanyManagerDashboard() {
  const companyInvoices = mockInvoices.filter((i) => i.companyOrgId === "org-company-1")
  const companyEmployees = mockUsers.filter((u) => u.orgId === "org-company-1" && u.role === "COMPANY_USER")
  const flaggedInvoices = companyInvoices.filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
  const totalValue = companyInvoices.reduce((sum, inv) => sum + inv.totals_total, 0)
  const recentInvoices = companyInvoices.slice(-5).reverse()

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_MANAGER" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Company Manager Dashboard
            </h1>
            <p className="text-muted-foreground">Acme Corporation Overview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Invoices"
              value={companyInvoices.length}
              icon={FileText}
              description={`$${totalValue.toLocaleString()} total`}
            />
            <StatsCard
              title="Flagged Items"
              value={flaggedInvoices.length}
              icon={AlertTriangle}
              description="Requires attention"
            />
            <StatsCard
              title="Employees"
              value={companyEmployees.length}
              icon={Users}
              description="Active team members"
            />
            <StatsCard
              title="This Month"
              value={`$${(totalValue * 0.3).toLocaleString()}`}
              icon={TrendingUp}
              description="Invoice volume"
              trend={{ value: 12, isPositive: true }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Invoices
                </CardTitle>
                <CardDescription>Latest company submissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.invoiceNo}</p>
                        <p className="text-sm text-muted-foreground">by {invoice.uploadedByName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  AI Alerts
                </CardTitle>
                <CardDescription>Invoices flagged by AI analysis</CardDescription>
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
