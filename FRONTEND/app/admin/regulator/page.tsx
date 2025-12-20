import { AdminSidebar } from "@/components/admin-sidebar"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockInvoices, mockOrganizations, mockAuditLogs } from "@/lib/mock-data"
import { Users, FileText, Link2, AlertTriangle, Eye } from "lucide-react"
import { InvoiceStatusBadge } from "@/components/status-badge"
import { Badge } from "@/components/ui/badge"

export default function RegulatorDashboard() {
  const companies = mockOrganizations.filter((o) => o.type === "company")
  const verifiedOnChain = mockInvoices.filter((i) => i.blockchain_txHash).length
  const totalValue = mockInvoices.reduce((sum, inv) => sum + inv.totals_total, 0)
  const fraudulentCount = mockInvoices.filter((i) => i.status === "fraudulent").length
  const recentLogs = mockAuditLogs.slice(-5).reverse()

  return (
    <div className="flex h-screen">
      <AdminSidebar role="REGULATOR" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Regulator Dashboard
            </h1>
            <p className="text-muted-foreground">Read-only compliance oversight</p>
            <Badge variant="outline" className="mt-2">
              Read-Only Access
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="Registered Companies" value={companies.length} icon={Users} description="On platform" />
            <StatsCard
              title="Total Invoices"
              value={mockInvoices.length}
              icon={FileText}
              description={`$${totalValue.toLocaleString()} total`}
            />
            <StatsCard
              title="Blockchain Verified"
              value={verifiedOnChain}
              icon={Link2}
              description="Tamper-proof records"
            />
            <StatsCard
              title="Fraud Detected"
              value={fraudulentCount}
              icon={AlertTriangle}
              description="Confirmed cases"
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
                <CardDescription>Latest submissions across all companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInvoices
                    .slice(-5)
                    .reverse()
                    .map((invoice) => (
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
                          <InvoiceStatusBadge status={invoice.status} />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  System Activity
                </CardTitle>
                <CardDescription>Recent actions in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLogs.map((log) => (
                    <div key={log._id} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                        <p className="text-sm text-muted-foreground">
                          by {log.actorName} • {log.entity_type}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
