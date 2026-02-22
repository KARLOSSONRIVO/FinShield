import Link from "next/link"
import { BackButton } from "@/components/common/BackButton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import { FileText, Shield, ArrowLeft, AlertTriangle } from "lucide-react"
import { AIVerdictBadge, DecisionBadge } from "@/components/common/StatusBadge"
import { cn } from "@/lib/utils"

export default async function EmployeeInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice: any = null
  const reviews: any[] = []

  if (!invoice) {
    return (
      <div className="p-6">
        <p>Invoice not found</p>
        <Link href="/company/employee/invoices">
          <Button variant="link">Back to Invoices</Button>
        </Link>
      </div>
    )
  }

  const isFraudulent = invoice.status === "fraudulent"
  const isFlagged = invoice.status === "flagged" || invoice.ai_verdict === "flagged"

  // Determine theme colors based on status
  const themeColor = isFraudulent ? "text-red-600" : isFlagged ? "text-amber-600" : "text-emerald-600"
  const barColor = isFraudulent ? "bg-red-600" : isFlagged ? "bg-amber-600" : "bg-emerald-600"
  const borderColor = isFraudulent ? "border-red-200" : isFlagged ? "border-amber-200" : "border-border"

  const riskPercentage = ((invoice.ai_riskScore ?? 0) * 100).toFixed(0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white border border-border rounded-lg shadow-sm">
            <FileText className={cn("h-8 w-8", themeColor)} />
          </div>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {invoice.invoiceNo}
            </h1>
            <p className="text-muted-foreground">FinShield Platform</p>
          </div>
        </div>
        <BackButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Details Card */}
        <Card className={cn("bg-white shadow-sm", borderColor)}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs font-bold text-black uppercase mb-1">Invoice Number</p>
                <p className="text-sm font-medium text-muted-foreground">{invoice.invoiceNo}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase mb-1">Invoice Date</p>
                <p className="text-sm font-medium text-muted-foreground">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase mb-1">Total Amount</p>
                <p className="text-lg font-bold text-black">${invoice.totals_total?.toLocaleString() ?? '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase mb-1">Uploaded By</p>
                <p className="text-sm font-medium text-muted-foreground">John Doe</p> {/* Mock data doesn't have name, using placeholder */}
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase mb-1">Created At</p>
                <p className="text-sm font-medium text-muted-foreground">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase mb-1">Last Updated</p>
                <p className="text-sm font-medium text-muted-foreground">{invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleString() : (invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleString() : 'N/A')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Fraud Analysis Card */}
        <Card className={cn("bg-white shadow-sm", borderColor)}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <AlertTriangle className="h-5 w-5" />
              AI Fraud Analysis
            </CardTitle>
            <CardDescription>Automated anomalous detection results</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/20">
              <span className="font-bold text-sm">AI Verdict</span>
              <AIVerdictBadge verdict={invoice.ai_verdict ?? 'clean'} score={invoice.ai_riskScore ?? 0} />
            </div>

            <div className="p-4 border rounded-xl bg-muted/20">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Risk Score</span>
                <span className="font-bold text-sm">{riskPercentage}%</span>
              </div>
              <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColor)}
                  style={{ width: `${riskPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review History Card - Full Width */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Shield className="h-5 w-5" />
                Review History
              </CardTitle>
              <CardDescription>Auditor decisions and notes</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="p-4 border border-border rounded-xl flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm mb-1">{review.reviewerName || "Auditor"}</h4>
                        {review.notes ? (
                          <p className="text-sm text-black font-medium">{review.notes}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No notes provided.</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <DecisionBadge decision={review.decision} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">No reviews yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  )
}
