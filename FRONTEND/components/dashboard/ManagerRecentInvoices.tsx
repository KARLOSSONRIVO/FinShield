"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/common/StatusBadge"
import { FileText } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface RecentInvoicesProps {
    invoices: Invoice[]
    title?: string
    description?: string
}

export function ManagerRecentInvoices({
    invoices,
    title = "Recent Invoices",
    description = "Latest submissions"
}: RecentInvoicesProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pending Reviews
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <div key={invoice._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">{invoice.invoiceNo}</p>
                                        <p className="text-sm text-muted-foreground font-medium">Example Corporation</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg mb-1">${(invoice.totals_total || 0).toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">Verified</span>
                                        <span className="border border-emerald-200 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded">Risk: 5%</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No pending reviews</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
