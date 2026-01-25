"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AIVerdictBadge } from "@/components/status-badge"
import { AlertTriangle } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface AIAlertsProps {
    invoices: Invoice[]
}

export function EmployeeAIAlerts({ invoices }: AIAlertsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    AI Alerts
                </CardTitle>
                <CardDescription>Invoices flagged by AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <div
                                key={invoice._id}
                                className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border-l-2 border-warning"
                            >
                                <div>
                                    <p className="font-medium">{invoice.invoiceNo}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No alerts at this time</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
