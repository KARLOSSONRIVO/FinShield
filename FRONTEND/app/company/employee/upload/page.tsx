"use client"

import type React from "react"

import { useState } from "react"
import { CompanySidebar } from "@/components/company-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle } from "lucide-react"

export default function EmployeeUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [invoiceNo, setInvoiceNo] = useState("")
  const [invoiceDate, setInvoiceDate] = useState("")
  const [amount, setAmount] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)

    // Simulate upload
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsUploading(false)
    setUploadSuccess(true)

    // Reset after showing success
    setTimeout(() => {
      setFile(null)
      setInvoiceNo("")
      setInvoiceDate("")
      setAmount("")
      setUploadSuccess(false)
    }, 3000)
  }

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_USER" />
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
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Fill in the invoice information and upload the document</CardDescription>
              </CardHeader>
              <CardContent>
                {uploadSuccess ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Invoice Uploaded Successfully!</h3>
                    <p className="text-muted-foreground">
                      Your invoice is now being processed by AI and will be anchored to the blockchain.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoiceNo">Invoice Number</Label>
                        <Input
                          id="invoiceNo"
                          placeholder="INV-2024-XXX"
                          value={invoiceNo}
                          onChange={(e) => setInvoiceNo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoiceDate">Invoice Date</Label>
                        <Input
                          id="invoiceDate"
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Total Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">Invoice Document</Label>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <input
                          id="file"
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label htmlFor="file" className="cursor-pointer">
                          {file ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="h-8 w-8 text-primary" />
                              <span className="font-medium">{file.name}</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-muted-foreground">Click to upload or drag and drop</p>
                              <p className="text-sm text-muted-foreground">PDF, PNG, or JPG (max 10MB)</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isUploading}>
                      {isUploading ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Invoice
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
