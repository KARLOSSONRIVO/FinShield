"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AIVerdictBadge } from "@/components/status-badge"
import { AlertTriangle } from "lucide-react"
import type { Invoice } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AIAlertsProps {
    invoices: Invoice[]
}

export function ManagerAIAlerts({ invoices }: AIAlertsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Flagged Items
                </CardTitle>
                <CardDescription>High-risk invoices that requires your immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <div
                                key={invoice._id}
                                className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center",
                                        invoice.status === 'fraudulent' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                                    )}>
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">Flagged {invoice.invoiceNo}</p>
                                        <p className="text-sm text-muted-foreground font-medium">Example Corporation</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg mb-1">${invoice.totals_total.toLocaleString()}</p>
                                    <div className="flex items-center justify-end gap-2">
                                        {invoice.status === 'fraudulent' ? (
                                            <>
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">Fraudulent</span>
                                                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">Risk: 65%</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded">Flagged</span>
                                                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded">Risk: 65%</span>
                                            </>
                                        )}
                                    </div>
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
