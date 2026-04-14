import { CompanySidebar } from "@/components/company-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockInvoices } from "@/lib/mock-data"
import { AlertTriangle, XCircle, Clock, Info, TrendingUp } from "lucide-react"
import { AIVerdictBadge, InvoiceStatusBadge } from "@/components/status-badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ManagerAlertsPage() {
  const companyInvoices = mockInvoices.filter((i) => i.companyOrgId === "org-company-1")
  const flaggedInvoices = companyInvoices.filter((i) => i.ai_verdict === "flagged" || i.status === "flagged")
  const fraudulentInvoices = companyInvoices.filter((i) => i.status === "fraudulent")
  const pendingInvoices = companyInvoices.filter((i) => i.status === "pending")
  const highRiskInvoices = companyInvoices.filter((i) => i.ai_riskScore > 0.7)

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_MANAGER" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              Company Alerts
            </h1>
            <p className="text-muted-foreground">All company invoices requiring attention</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{fraudulentInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Fraudulent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-warning">{flaggedInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Flagged</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{highRiskInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">High Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fraudulent */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Fraudulent Invoices
                </CardTitle>
                <CardDescription>Confirmed fraudulent by auditors</CardDescription>
              </CardHeader>
              <CardContent>
                {fraudulentInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {fraudulentInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border-l-2 border-destructive"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">
                            by {invoice.uploadedByName} - ${invoice.totals_total.toLocaleString()}
                          </p>
                        </div>
                        <Link href={`/company/manager/invoices/${invoice._id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No fraudulent invoices</p>
                )}
              </CardContent>
            </Card>

            {/* Flagged */}
            <Card className="border-warning/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  AI Flagged Invoices
                </CardTitle>
                <CardDescription>Flagged for potential issues</CardDescription>
              </CardHeader>
              <CardContent>
                {flaggedInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {flaggedInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border-l-2 border-warning"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">by {invoice.uploadedByName}</p>
                          <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                        </div>
                        <Link href={`/company/manager/invoices/${invoice._id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No flagged invoices</p>
                )}
              </CardContent>
            </Card>

            {/* Pending */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Review
                </CardTitle>
                <CardDescription>Company invoices awaiting auditor review</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvoices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">by {invoice.uploadedByName}</p>
                          <p className="text-sm font-medium">${invoice.totals_total.toLocaleString()}</p>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center py-4 text-muted-foreground">
                    <Info className="h-4 w-4" />
                    All invoices have been reviewed
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
