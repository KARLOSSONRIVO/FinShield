"use client"

import type React from "react"

import { EmployeeSidebar } from "@/features/company-employee/navigation-bar/EmployeeSidebar"
import { Upload } from "lucide-react"

import { EmployeeUploadInvoiceForm } from "@/features/company-employee/upload/components/EmployeeUploadInvoiceForm"
import { useEmployeeUploadInvoice } from "@/features/company-employee/upload/hooks/useEmployeeUploadInvoice"

export default function EmployeeUploadPage() {
  const {
    file,
    values,
    isUploading,
    uploadSuccess,
    handleFileChange,
    setValue,
    upload
  } = useEmployeeUploadInvoice()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await upload()
  }

  return (
    <div className="flex h-screen">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Upload className="h-6 w-6 text-primary" />
              Upload Invoice
            </h1>
            <p className="text-muted-foreground">Submit new invoices for AI analysis and blockchain verification</p>
          </div>

          <div className="max-w-2xl">
            <EmployeeUploadInvoiceForm
              file={file}
              values={values}
              isUploading={isUploading}
              uploadSuccess={uploadSuccess}
              onFileChange={handleFileChange}
              onValueChange={setValue}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
