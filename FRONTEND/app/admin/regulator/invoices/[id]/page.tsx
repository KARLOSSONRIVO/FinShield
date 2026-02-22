"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Blocks, History, ShieldAlert, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { use } from "react"
import { Invoice } from "@/lib/types"

export default function RegulatorInvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  // Mock data removed. Requires API integration.
  const invoice = undefined as Invoice | undefined

  if (!invoice) {
    return <div className="p-6">Invoice not found for ID: {id}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center border border-border">
            <FileText className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black">{invoice.invoiceNo}</h2>
            <p className="text-muted-foreground font-medium">FinShield Platform</p>
          </div>
        </div>
        <Link href="/admin/regulator/invoices">
          <Button variant="ghost" className="gap-2 text-black font-bold hover:bg-transparent hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Card 1: Invoice Details */}
        <Card className="border-2 border-border shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <FileText className="h-5 w-5" />
              Invoice Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <p className="text-xs font-bold text-black uppercase">Invoice Number</p>
                <p className="text-sm font-medium mt-1">{invoice.invoiceNo}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Invoice Date</p>
                <p className="text-sm font-medium mt-1">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Total Amount</p>
                <p className="text-xl font-extrabold text-black mt-1">${invoice.totals_total?.toLocaleString() ?? '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Uploaded By</p>
                <p className="text-sm font-medium mt-1">{invoice.uploadedByName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Created At</p>
                <p className="text-sm font-medium mt-1">{new Date(invoice.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-black uppercase">Last Updated</p>
                <p className="text-sm font-medium mt-1">{new Date(invoice.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: AI Fraud Analysis */}
        <Card className="border-2 border-border shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <ShieldAlert className="h-5 w-5" />
              AI Fraud Analysis
            </CardTitle>
            <p className="text-xs text-muted-foreground font-medium">Automated anomalous detection results</p>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-border">
              <span className="font-bold text-sm">AI Verdict</span>
              <Badge className={`${invoice.ai_verdict === 'clean' ? 'bg-emerald-600' :
                invoice.ai_verdict === 'flagged' ? 'bg-yellow-500 text-black' : 'bg-red-600'
                } hover:opacity-90 rounded-md px-4 capitalize`}>
                {invoice.ai_verdict ?? 'Unknown'}
              </Badge>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">Risk Score</span>
                <span className="font-bold text-sm">{Math.round((invoice.ai_riskScore ?? 0) * 100)}%</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden border border-border">
                <div
                  className={`h-full ${(invoice.ai_riskScore ?? 0) < 0.3 ? 'bg-emerald-500' :
                    (invoice.ai_riskScore ?? 0) < 0.79 ? 'bg-yellow-500' : 'bg-red-600'
                    } transition-all duration-500`}
                  style={{ width: `${(invoice.ai_riskScore ?? 0) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Blockchain Verification */}
        <Card className="border-2 border-border shadow-sm rounded-xl h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Blocks className="h-5 w-5" />
              Blockchain Verification
            </CardTitle>
            <p className="text-xs text-muted-foreground font-medium">Tamper-proof ledger record</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">Transaction Hash</p>
              <div className="bg-muted p-2 rounded border border-border text-xs font-mono text-muted-foreground truncate">
                {(invoice.ai_verdict === 'flagged' || invoice.status === 'fraudulent' || invoice.status === 'flagged')
                  ? "None"
                  : "0x1234567890abcdef1234567890abcdef12345678"
                }
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs font-bold text-muted-foreground mb-1">Anchored At</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-sm">
                  {(invoice.ai_verdict === 'flagged' || invoice.status === 'fraudulent' || invoice.status === 'flagged')
                    ? "-/-/-, --:--:00 AM"
                    : "12/2/2024, 10:30:00 AM"
                  }
                </span>
              </div>

              {(invoice.ai_verdict === 'flagged' || invoice.status === 'fraudulent' || invoice.status === 'flagged') ? (
                <Badge className="bg-red-600 hover:bg-red-700 border-none text-white px-3 flex items-center gap-1 w-fit">
                  <ShieldAlert className="h-3 w-3" />
                  Unverified on Blockchain
                </Badge>
              ) : (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none text-white px-3 flex items-center gap-1 w-fit">
                  <ShieldCheck className="h-3 w-3" />
                  Verified on Blockchain
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Review History */}
        <Card className="border-2 border-border shadow-sm rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <History className="h-5 w-5" />
              Review History
            </CardTitle>
            <p className="text-xs text-muted-foreground font-medium">Auditor decisions and notes</p>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="border border-border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">Auditor 1</span>
                <Badge className="bg-emerald-600 text-white text-[10px] capitalize">{invoice.status}</Badge>
              </div>
              <p className="text-xs font-medium text-black">
                {invoice.status === 'verified' ? 'All documentation verified. Invoice matches purchase order.' : 'Pending review.'}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">{new Date(invoice.updatedAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
