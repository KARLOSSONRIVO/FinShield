"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card'
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { InvoiceStatusBadge } from "@/components/common/StatusBadge"
import type { Invoice } from '@/types'

interface PendingReviewsProps {
    invoices: Invoice[]
}

export function PendingReviews({ invoices }: PendingReviewsProps) {
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
                    {invoices.slice(0, 5).map((invoice) => (
                        <div key={invoice._id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                            <div>
                                <p className="font-bold">{invoice.companyName}</p>
                                <p className="text-xs text-muted-foreground">{invoice.invoiceNo} • {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-orange-600">Pending</p>
                                <p className="text-xs font-medium">${invoice.totals_total?.toLocaleString() ?? '0.00'}</p>
                            </div>
                        </div>
                    ))}
                    {invoices.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No pending reviews.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
