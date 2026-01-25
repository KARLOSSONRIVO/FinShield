"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle } from "lucide-react"

interface UploadInvoiceFormProps {
    file: File | null
    values: {
        invoiceNo: string
        invoiceDate: string
        amount: string
    }
    isUploading: boolean
    uploadSuccess: boolean
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onValueChange: (field: string, value: string) => void
    onSubmit: (e: React.FormEvent) => void
}

export function EmployeeUploadInvoiceForm({
    file,
    values,
    isUploading,
    uploadSuccess,
    onFileChange,
    onValueChange,
    onSubmit,
}: UploadInvoiceFormProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
                <CardDescription>Fill in the invoice information and upload the document (Employee)</CardDescription>
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
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="invoiceNo">Invoice Number</Label>
                                <Input
                                    id="invoiceNo"
                                    placeholder="INV-2024-XXX"
                                    value={values.invoiceNo}
                                    onChange={(e) => onValueChange("invoiceNo", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invoiceDate">Invoice Date</Label>
                                <Input
                                    id="invoiceDate"
                                    type="date"
                                    value={values.invoiceDate}
                                    onChange={(e) => onValueChange("invoiceDate", e.target.value)}
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
                                value={values.amount}
                                onChange={(e) => onValueChange("amount", e.target.value)}
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
                                    onChange={onFileChange}
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
    )
}
