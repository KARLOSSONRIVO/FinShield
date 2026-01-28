"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface FlaggedItemsProps {
    invoices: any[]
}

export function FlaggedItems({ invoices }: FlaggedItemsProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Flagged Items
                </CardTitle>
                <CardDescription>High-risk invoices that requires your immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.slice(0, 5).map((invoice) => {
                            const isFraud = invoice.ai_verdict === "Fraudulent" || invoice.status === "Fraud";
                            const badgeColor = isFraud ? "bg-destructive" : "bg-yellow-500";
                            const iconColor = isFraud ? "text-destructive" : "text-yellow-500";
                            const borderColor = isFraud ? "border-l-destructive" : "border-l-yellow-500";

                            return (
                                <div
                                    key={invoice._id}
                                    className={`flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow border-l-4 ${borderColor}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${iconColor}`}>
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">Flagged {invoice.invoiceNo}</p>
                                            <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg mb-1">${invoice.totals_total.toLocaleString()}</p>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-white ${badgeColor}`}>
                                                {invoice.status}
                                            </span>
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                Risk: {invoice.ai_riskScore}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No flagged items</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
