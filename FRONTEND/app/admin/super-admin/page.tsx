import { AdminSidebar } from "@/components/admin-sidebar"
import { StatsCard } from "@/components/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockInvoices, mockOrganizations, mockUsers, mockAuditLogs } from "@/lib/mock-data"
import { Building2, Users, FileText, AlertTriangle, Shield, TrendingUp } from "lucide-react"
import { InvoiceStatusBadge } from "@/components/status-badge"

export default function SuperAdminDashboard() {
  const companies = mockOrganizations.filter((o) => o.type === "company")
  const flaggedInvoices = mockInvoices.filter((i) => i.status === "flagged" || i.status === "fraudulent")
  const totalValue = mockInvoices.reduce((sum, inv) => sum + inv.totals_total, 0)
  const recentLogs = mockAuditLogs.slice(-5).reverse()
  const recentInvoices = mockInvoices.slice(-5).reverse()

  return (
    <div className="flex h-screen">
      <AdminSidebar role="SUPER_ADMIN" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Super Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Full platform overview and management</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Total Companies"
              value={companies.length}
              icon={Building2}
              description="Active organizations"
            />
            <StatsCard
              title="Total Users"
              value={mockUsers.length}
              icon={Users}
              description="Across all organizations"
            />
            <StatsCard
              title="Total Invoices"
              value={mockInvoices.length}
              icon={FileText}
              description={`$${totalValue.toLocaleString()} total value`}
            />
            <StatsCard
              title="Flagged/Fraud"
              value={flaggedInvoices.length}
              icon={AlertTriangle}
              description="Requires attention"
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
                <CardDescription>Latest invoice submissions across all companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentInvoices.map((invoice) => (
                    <div key={invoice._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
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
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest actions in the system</CardDescription>
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
