"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AIVerdictBadge } from "@/components/status-badge"
import { AlertTriangle, FileText } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface AIAlertsProps {
    invoices: Invoice[]
}

export function EmployeeAIAlerts({ invoices }: AIAlertsProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-black border-none flex items-center gap-2">
                    <span className="text-red-500"><AlertTriangle className="h-5 w-5" /></span>
                    Recent Alerts
                </CardTitle>
                <a href="/company/employee/alerts" className="text-sm font-bold text-black hover:underline cursor-pointer">
                    View All →
                </a>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 pt-2">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <div key={invoice._id} className="flex items-center gap-4 p-4 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="bg-emerald-600 p-2 rounded-lg">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold text-base text-black">Flagged {invoice.invoiceNo}</p>
                                    <p className="text-xs text-muted-foreground font-medium">2 hours ago</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No recent alerts</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
