"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import type { ListInvoice } from "@/lib/types"

interface RecentInvoicesProps {
    invoices: ListInvoice[]
}

function getStatusColor(status: string) {
    switch (status) {
        case "verified": return "bg-emerald-600 text-white"
        case "flagged": return "bg-yellow-500 text-black"
        case "fraudulent": return "bg-red-600 text-white"
        case "anchored": return "bg-blue-500 text-white"
        default: return "bg-gray-400 text-white"
    }
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
                {invoices.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8 border-2 border-dashed rounded-xl">
                        No invoices found.
                    </p>
                ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {invoices.map((invoice) => {
                            const id = invoice.id || (invoice as any)._id
                            return (
                                <div key={id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors bg-card">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                            <FileText className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">{invoice.invoiceNumber || "—"}</p>
                                            <p className="text-xs font-medium text-muted-foreground">{invoice.company || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {invoice.date ? new Date(invoice.date).toLocaleDateString() : "—"}
                                        </p>
                                        {invoice.amount != null && (
                                            <p className="text-sm font-bold">${invoice.amount.toLocaleString()}</p>
                                        )}
                                        <Badge className={`${getStatusColor(invoice.status)} rounded-md px-2 py-0 text-[10px] font-bold capitalize`}>
                                            {invoice.status}
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
