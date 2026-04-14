"use client"

import { use } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { mockInvoices, mockReviews } from "@/lib/mock-data"
import { InvoiceStatusBadge, AIVerdictBadge, DecisionBadge } from "@/components/status-badge"
import { ArrowLeft, FileText, Brain, Link2, ClipboardCheck } from "lucide-react"
import Link from "next/link"

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const invoice = mockInvoices.find((i) => i._id === id)
  const reviews = mockReviews.filter((r) => r.invoiceId === id)

  if (!invoice) {
    return (
      <div className="flex h-screen">
        <AdminSidebar role="SUPER_ADMIN" />
        <main className="flex-1 flex items-center justify-center">
          <p>Invoice not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar role="SUPER_ADMIN" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Link href="/admin/super-admin/invoices">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {invoice.invoiceNo}
              </h1>
              <p className="text-muted-foreground">{invoice.companyName}</p>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
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
                    <p className="text-sm text-muted-foreground">Uploaded By</p>
                    <p className="font-medium">{invoice.uploadedByName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="font-medium">{new Date(invoice.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{new Date(invoice.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Fraud Analysis
                </CardTitle>
                <CardDescription>Automated anomaly detection results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">AI Verdict</span>
                  <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Risk Score</p>
                  <div className="w-full bg-background rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        invoice.ai_riskScore > 0.7
                          ? "bg-destructive"
                          : invoice.ai_riskScore > 0.4
                            ? "bg-warning"
                            : "bg-primary"
                      }`}
                      style={{ width: `${invoice.ai_riskScore * 100}%` }}
                    />
                  </div>
                  <p className="text-right text-sm mt-1 font-mono">{(invoice.ai_riskScore * 100).toFixed(0)}%</p>
                </div>
              </CardContent>
            </Card>

            {/* Blockchain Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  Blockchain Verification
                </CardTitle>
                <CardDescription>Tamper-proof ledger record</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.blockchain_txHash ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Hash</p>
                      <p className="font-mono text-sm break-all bg-secondary/50 p-2 rounded mt-1">
                        {invoice.blockchain_txHash}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Anchored At</p>
                      <p className="font-medium">
                        {invoice.blockchain_anchoredAt ? new Date(invoice.blockchain_anchoredAt).toLocaleString() : "-"}
                      </p>
                    </div>
                    <Badge variant="default" className="bg-primary text-primary-foreground">
                      Verified on Blockchain
                    </Badge>
                  </>
                ) : (
                  <p className="text-muted-foreground">Pending blockchain verification</p>
                )}
              </CardContent>
            </Card>

            {/* Review History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary" />
                  Review History
                </CardTitle>
                <CardDescription>Auditor decisions and notes</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review._id} className="p-4 bg-secondary/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{review.reviewerName}</span>
                          <DecisionBadge decision={review.decision} />
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{review.notes}</p>
                        <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No reviews yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
