"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AIVerdictBadge } from "@/components/status-badge"
import { FileText } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface PendingReviewsProps {
    invoices: Invoice[]
}

export function PendingReviews({ invoices }: PendingReviewsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pending Reviews
                </CardTitle>
                <CardDescription>Invoices awaiting your decision</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.slice(0, 5).map((invoice) => (
                            <div
                                key={invoice._id}
                                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{invoice.invoiceNo}</p>
                                    <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">${invoice.totals_total.toLocaleString()}</p>
                                    <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
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
