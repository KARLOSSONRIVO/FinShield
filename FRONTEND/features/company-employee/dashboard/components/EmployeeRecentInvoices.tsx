"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/status-badge"
import { FileText } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface RecentInvoicesProps {
    invoices: Invoice[]
    title?: string
    description?: string
}

export function EmployeeRecentInvoices({
    invoices,
    title = "Recent Invoices",
    description = "Latest submissions"
}: RecentInvoicesProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <div key={invoice._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div>
                                    <p className="font-medium">{invoice.invoiceNo}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {invoice.uploadedByName ? `by ${invoice.uploadedByName}` : new Date(invoice.invoiceDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                                    <InvoiceStatusBadge status={invoice.status} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No invoices found</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
