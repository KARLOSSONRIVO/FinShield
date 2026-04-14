"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle } from "lucide-react"
import Link from "next/link"
import { MyInvoice } from "@/lib/types"

interface RejectedItemsProps {
    invoices: MyInvoice[]
}

export default function RejectedItems({ invoices }: RejectedItemsProps) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Rejected Items
                </CardTitle>
                <CardDescription>Invoices that were rejected and need your attention</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {invoices && invoices.length > 0 ? (
                        invoices.map((invoice) => (
                            <Link
                                key={invoice.id}
                                href={`/company/employee/invoices/${invoice.id}`}
                                className="block"
                            >
                                <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow border-l-4 border-l-red-500 cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                            <XCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base">{invoice.invoiceNumber || "Unknown"}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {invoice.uploadedAt ? new Date(invoice.uploadedAt).toLocaleDateString() : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg mb-1">
                                            ₱{(invoice.amount || 0).toLocaleString()}
                                        </p>
                                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-white bg-red-500">
                                            Rejected
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No rejected items</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}