"use client"

import { use } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InvoiceDetails } from "@/components/invoices/AuditorInvoiceDetails"
import { MOCK_AUDITOR_INVOICES } from "@/hooks/mock-data"

export default function AuditorInvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const invoice = MOCK_AUDITOR_INVOICES.find(i => i._id === id)

  if (!invoice) {
    return <div className="p-6">Invoice not found for ID: {id}</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            {invoice.invoiceNo}
          </h2>
          <p className="text-muted-foreground font-medium">FinShield Platform</p>
        </div>
        <Link href="/admin/auditor/invoices">
          <Button variant="ghost" className="gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </Link>
      </div>

      {/* Content */}
      <InvoiceDetails invoice={invoice} />
    </div>
  )
}
