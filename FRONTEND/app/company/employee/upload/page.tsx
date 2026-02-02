"use client"

import { UploadInvoiceForm } from "@/components/invoices/UploadInvoiceForm"

export default function EmployeeUploadPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Uploading Invoice
        </h1>
      </div>

      <div className="w-full">
        <UploadInvoiceForm />
      </div>
    </div>
  )
}
