import Link from "next/link"
import { EmployeeSidebar } from "@/features/company-employee/navigation-bar/EmployeeSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { mockInvoices, mockReviews } from "@/lib/mock-data"
import { ArrowLeft, FileText, Shield, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { InvoiceStatusBadge, AIVerdictBadge, DecisionBadge } from "@/components/status-badge"

export default async function EmployeeInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = mockInvoices.find((i) => i._id === id)
  const reviews = mockReviews.filter((r) => r.invoiceId === id)

  if (!invoice) {
    return (
      <div className="flex h-screen">
        <EmployeeSidebar />
        <main className="flex-1 overflow-auto p-6">
          <p>Invoice not found</p>
        </main>
      </div>
    )
  }

  const getStatusIcon = () => {
    switch (invoice.status) {
      case "verified":
        return <CheckCircle className="h-8 w-8 text-primary" />
      case "flagged":
        return <AlertTriangle className="h-8 w-8 text-warning" />
      case "fraudulent":
        return <XCircle className="h-8 w-8 text-destructive" />
      default:
        return <Clock className="h-8 w-8 text-muted-foreground" />
    }
  }

  return (
    <div className="flex h-screen">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <Link href="/company/employee/invoices">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Invoices
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              {getStatusIcon()}
              <div>
                <h1 className="text-2xl font-bold">{invoice.invoiceNo}</h1>
                <p className="text-muted-foreground">{invoice.companyName}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Invoice Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-medium">{invoice.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Date</p>
                    <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-medium text-lg">${invoice.totals_total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">AI Analysis</p>
                  <div className="flex items-center gap-4">
                    <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                    <span className="text-sm text-muted-foreground">
                      Risk Score: {(invoice.ai_riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {invoice.blockchain_txHash && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Blockchain Verification</p>
                      <div className="bg-secondary/50 p-3 rounded-lg">
                        <p className="text-xs font-mono break-all">{invoice.blockchain_txHash}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Anchored: {new Date(invoice.blockchain_anchoredAt!).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Review History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Review History
                </CardTitle>
                <CardDescription>Auditor decisions</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review._id} className="p-3 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{review.reviewerName}</span>
                          <DecisionBadge decision={review.decision} />
                        </div>
                        {review.notes && <p className="text-sm text-muted-foreground">{review.notes}</p>}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
