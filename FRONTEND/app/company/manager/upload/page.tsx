"use client"

import { UploadInvoiceForm } from "@/components/invoices/UploadInvoiceForm"

export default function UploadInvoicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Upload Invoice</h2>
      </div>

      <UploadInvoiceForm />
    </div>
  )
}
