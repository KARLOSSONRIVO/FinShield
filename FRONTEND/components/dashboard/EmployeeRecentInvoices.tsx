"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceStatusBadge } from "@/components/common/StatusBadge"
import { FileText } from "lucide-react"
import Link from "next/link"
import { MyInvoice } from "@/lib/types"

interface RecentInvoicesProps {
    invoices: MyInvoice[]
    title?: string
    description?: string
}

export function EmployeeRecentInvoices({
    invoices,
    title = "Recent Invoices",
    description = "Latest submissions"
}: RecentInvoicesProps) {
    // Format date relative to now
    const formatRelativeTime = (dateString?: string) => {
        if (!dateString) return "Unknown date"

        try {
            const date = new Date(dateString)
            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMins / 60)
            const diffDays = Math.floor(diffHours / 24)

            if (diffMins < 1) return "Just now"
            if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
            if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
            if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

            return date.toLocaleDateString()
        } catch {
            return "Unknown date"
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-xl font-bold text-foreground border-none">
                        {title}
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <Link href="/company/employee/invoices" className="text-sm font-bold text-foreground hover:underline cursor-pointer">
                    View All →
                </Link>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 pt-2">
                    {invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <Link
                                key={invoice.id}
                                href={`/company/employee/invoices/${invoice.id}`}
                                className="block"
                            >
                                <div className="flex items-center justify-between p-4 bg-white border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-[#3b5998] p-2 rounded-lg">
                                            <FileText className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base text-foreground">{invoice.invoiceNumber}</p>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {formatRelativeTime(invoice.uploadedAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-base text-foreground">
                                            ₱{(invoice.amount || 0).toLocaleString()}
                                        </p>
                                        <div className="mt-1 flex justify-end">
                                            <InvoiceStatusBadge status={invoice.status as any} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No recent invoices</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}