'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface PendingReviewsProps {
    invoices: Invoice[]
}

export function PendingReviews({ invoices }: PendingReviewsProps) {
    // Filter only invoices with status 'pending' (case-insensitive)
    const pendingInvoices = invoices.filter(inv =>
        inv.status?.toLowerCase() === 'pending'
    )

    const formatDate = (dateValue: string | Date | undefined): string => {
        if (!dateValue) return 'N/A'
        try {
            return new Date(dateValue).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            })
        } catch {
            return 'Invalid date'
        }
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Pending Reviews
                        </CardTitle>
                        <CardDescription>Invoices waiting for verification</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {pendingInvoices.slice(0, 7).map((invoice) => {
                        const invoiceNumber = invoice.invoiceNumber || invoice.invoiceNo || 'N/A'
                        const companyName = invoice.companyName || 'Unknown Company'
                        const date = formatDate(invoice.date || invoice.invoiceDate)

                        return (
                            <div key={invoice.id || invoice._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                <div>
                                    <p className="font-bold">{invoiceNumber}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {companyName} • {date}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm text-muted-foreground">PENDING</p>
                                    <p className="text-xs font-medium">
                                        ₱{(invoice.amount || invoice.totalAmount || invoice.totals_total || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    {pendingInvoices.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No pending reviews.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}