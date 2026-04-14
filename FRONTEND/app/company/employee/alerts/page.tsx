import { CompanySidebar } from "@/components/company-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { mockInvoices } from "@/lib/mock-data"
import { AlertTriangle, XCircle, Clock, Info } from "lucide-react"
import { AIVerdictBadge, InvoiceStatusBadge } from "@/components/status-badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function EmployeeAlertsPage() {
  const myInvoices = mockInvoices.filter((i) => i.uploadedByUserId === "user-employee-1")
  const flaggedInvoices = myInvoices.filter((i) => i.ai_verdict === "flagged" || i.status === "flagged")
  const fraudulentInvoices = myInvoices.filter((i) => i.status === "fraudulent")
  const pendingInvoices = myInvoices.filter((i) => i.status === "pending")

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_USER" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              Alerts
            </h1>
            <p className="text-muted-foreground">Invoices requiring your attention</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fraudulent - Highest Priority */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-5 w-5" />
                  Marked as Fraudulent
                </CardTitle>
                <CardDescription>These invoices have been flagged as fraudulent by auditors</CardDescription>
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
                          <p className="text-sm text-muted-foreground">${invoice.totals_total.toLocaleString()}</p>
                        </div>
                        <Link href={`/company/employee/invoices/${invoice._id}`}>
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

            {/* Flagged by AI */}
            <Card className="border-warning/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  AI Flagged
                </CardTitle>
                <CardDescription>Invoices flagged by AI for potential issues</CardDescription>
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
                          <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                        </div>
                        <Link href={`/company/employee/invoices/${invoice._id}`}>
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

            {/* Pending Review */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pending Review
                </CardTitle>
                <CardDescription>Invoices awaiting auditor review</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvoices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingInvoices.map((invoice) => (
                      <div
                        key={invoice._id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{invoice.invoiceNo}</p>
                          <p className="text-sm text-muted-foreground">
                            ${invoice.totals_total.toLocaleString()} -{" "}
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </p>
                        </div>
                        <InvoiceStatusBadge status={invoice.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center py-4 text-muted-foreground">
                    <Info className="h-4 w-4" />
                    All your invoices have been reviewed
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
