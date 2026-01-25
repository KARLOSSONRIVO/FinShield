"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/status-badge"
import { FileText } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface RecentInvoicesProps {
    invoices: Invoice[]
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Invoices
                </CardTitle>
                <CardDescription>Latest submissions across all companies</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.map((invoice) => (
                        <div key={invoice._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                            <div>
                                <p className="font-medium">{invoice.invoiceNo}</p>
                                <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                                <InvoiceStatusBadge status={invoice.status} />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
