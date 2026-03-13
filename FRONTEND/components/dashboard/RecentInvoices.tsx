"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"
import type { ListInvoice } from "@/lib/types"

interface RecentInvoicesProps {
    invoices: ListInvoice[]
    title?: string
    description?: string
}

function getStatusColor(status: string) {
    const s = status?.toLowerCase() || ""
    switch (s) {
        case "clean": 
        case "approved":
        case "accepted":
            return "bg-emerald-600 text-white"
        case "flagged": 
        case "rejected":
            return "bg-red-600 text-white"
        case "anchored": 
            return "bg-blue-500 text-white"
        default: 
            return "bg-gray-400 text-white"
    }
}

export function RecentInvoices({ invoices, title = "Recent Invoices", description = "Latest invoice submissions" }: RecentInvoicesProps) {
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
                {invoices.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8 border-2 border-dashed rounded-xl">
                        No invoices found.
                    </p>
                ) : (
                    <div className="space-y-4">
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
                                            <p className="text-xs font-medium text-muted-foreground">{invoice.companyName || "—"}</p>
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {(() => {
                                                const dateStr = (invoice as any).blockchain?.anchoredAt || (invoice as any).anchoredAt || invoice.date || (invoice as any).createdAt
                                                return dateStr ? new Date(dateStr).toLocaleDateString() : "—"
                                            })()}
                                        </p>
                                        {invoice.amount != null && (
                                            <p className="text-sm font-bold">₱{invoice.amount.toLocaleString()}</p>
                                        )}
                                        <div className="flex items-center justify-end gap-2">
                                            {invoice.aiVerdict?.riskScore !== undefined && (
                                                <Badge
                                                    variant="outline"
                                                    className={invoice.status === 'flagged' ? "bg-red-50 text-red-600 border-red-200 rounded-md px-2 py-0 text-[10px] font-bold" : "bg-emerald-50 text-emerald-600 border-emerald-200 rounded-md px-2 py-0 text-[10px] font-bold"}
                                                >
                                                    Risk: {invoice.aiVerdict.riskScore}%
                                                </Badge>
                                            )}
                                            <Badge className={`${getStatusColor(invoice.status)} rounded-md px-2 py-0 text-[10px] font-bold capitalize`}>
                                                {invoice.status.toLowerCase() === "clean" || invoice.status.toLowerCase() === "accepted" ? "Approved" : invoice.status}
                                            </Badge>
                                        </div>
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
