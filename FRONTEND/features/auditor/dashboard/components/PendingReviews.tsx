"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

interface PendingReviewsProps {
    invoices: any[] // Using any to accept mock data structure readily
}

export function PendingReviews({ invoices }: PendingReviewsProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pending Reviews
                </CardTitle>
                <CardDescription>Latest invoice submissions for your decision</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.slice(0, 5).map((invoice) => (
                            <div
                                key={invoice._id}
                                className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-600/10 flex items-center justify-center text-emerald-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">{invoice.invoiceNo}</p>
                                        <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg mb-1">${invoice.totals_total.toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="inline-flex items-center rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-inset ring-emerald-600/10">
                                            {invoice.status}
                                        </span>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                            Risk: {invoice.ai_riskScore}%
                                        </span>
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
