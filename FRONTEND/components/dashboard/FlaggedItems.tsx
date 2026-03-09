'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface FlaggedItemsProps {
    invoices: any[] // can be improved with proper type
}

export function FlaggedItems({ invoices }: FlaggedItemsProps) {
    // Helper to determine badge color and text
    const getStatusInfo = (status: string) => {
        const s = status?.toLowerCase() || '';
        if (s === 'pending') {
            return { text: 'PENDING', className: 'bg-gray-500 text-white' };
        }
        if (s === 'rejected') {
            return { text: 'REJECTED', className: 'bg-red-700 text-white' };
        }
        return null; // means use existing logic
    };

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
                            const verdict = invoice.aiVerdict?.verdict || invoice.ai_verdict || '';
                            const isFraud = verdict.toLowerCase() === "flagged" || invoice.status === "flagged";
                            const badgeColor = isFraud ? "bg-destructive" : "bg-yellow-500";
                            const iconColor = isFraud ? "text-destructive" : "text-yellow-500";
                            const borderColor = isFraud ? "border-l-destructive" : "border-l-yellow-500";
                            const riskScore = invoice.aiVerdict?.riskScore ?? invoice.ai_riskScore ?? 0;

                            // Determine if status is pending or rejected (for badge override)
                            const statusInfo = getStatusInfo(invoice.status);
                            const finalBadgeClassName = statusInfo ? statusInfo.className : badgeColor;
                            const statusText = statusInfo ? statusInfo.text : (invoice.status || '').toUpperCase();

                            return (
                                <div
                                    key={invoice.id || invoice._id}
                                    className={`flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow border-l-4 ${borderColor}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-lg bg-secondary flex items-center justify-center ${iconColor}`}>
                                            <AlertTriangle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">Flagged {invoice.invoiceNumber || invoice.invoiceNo}</p>
                                            <p className="text-sm text-muted-foreground">{invoice.companyName}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg mb-1">${(invoice.amount || invoice.totalAmount || invoice.totals_total || 0).toLocaleString()}</p>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${finalBadgeClassName}`}>
                                                {statusText}
                                            </span>
                                            <span className="text-xs font-semibold text-muted-foreground">
                                                Risk: {riskScore}%
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