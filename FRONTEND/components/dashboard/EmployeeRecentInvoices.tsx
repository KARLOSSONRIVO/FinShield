"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/status-badge"
import { FileText } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface RecentInvoicesProps {
    invoices: Invoice[]
    title?: string
    description?: string
}

export function EmployeeRecentInvoices({
    invoices,
    title = "Recent Invoices",
    description = "Latest submissions"
}: RecentInvoicesProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold text-black border-none">
                    {title}
                </CardTitle>
                <a href="/company/employee/invoices" className="text-sm font-bold text-black hover:underline cursor-pointer">
                    View All →
                </a>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 pt-2">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <div key={invoice._id} className="flex items-center justify-between p-4 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="bg-emerald-600 p-2 rounded-lg">
                                        <FileText className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-black">{invoice.invoiceNo}</p>
                                        <p className="text-xs text-muted-foreground font-medium">Finance Administrator</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-base text-black">${invoice.totals_total.toLocaleString()}</p>
                                    <div className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ml-auto mt-1">
                                        VERIFIED
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No recent invoices</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
