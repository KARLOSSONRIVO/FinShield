"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/common/StatusBadge"
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
                <CardDescription>Latest invoice submissions</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {invoices.map((invoice) => (
                        <div key={invoice._id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors bg-card">
                            <div className="flex items-center gap-4">
                                {/* Green File Icon Box */}
                                <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-base">{invoice.invoiceNo}</p>
                                    <p className="text-xs font-medium text-muted-foreground">{invoice.companyName}</p>
                                </div>
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
