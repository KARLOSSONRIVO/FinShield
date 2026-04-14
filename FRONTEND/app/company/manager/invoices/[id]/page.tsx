"use client"

import { use } from "react"
import { CompanySidebar } from "@/components/company-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockInvoices, mockReviews } from "@/lib/mock-data"
import { InvoiceStatusBadge } from "@/components/status-badge"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default function ManagerInvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const invoice = mockInvoices.find(i => i._id === id)
  const reviews = mockReviews.filter(r => r.invoiceId === id)

  if (!invoice) {
    return (
      <div className="flex h-screen">
        <CompanySidebar role="COMPANY_MANAGER" />
        <main className="flex-1 flex items-center justify-center">
          <p>Invoice not found</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_MANAGER" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Link href="/company/manager/invoices">
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
              <p className="text-muted-foreground">Uploaded by {invoice.uploadedByName}</p>
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
                <div\
