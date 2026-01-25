"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/status-badge"
import { AlertTriangle } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface FlaggedItemsProps {
    invoices: Invoice[]
}

export function FlaggedItems({ invoices }: FlaggedItemsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Flagged Items
                </CardTitle>
                <CardDescription>High-risk invoices requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.slice(0, 5).map((invoice) => (
                            <div
                                key={invoice._id}
                                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border-l-2 border-warning"
                            >
                                <div>
                                    <p className="font-medium">{invoice.invoiceNo}</p>
                                    <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                                    <InvoiceStatusBadge status={invoice.status} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No flagged items</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
