"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, XCircle, ArrowRight, Eye } from "lucide-react"
import Link from "next/link"
import type { Invoice } from "@/lib/types"

interface AlertCardListProps {
    title: string
    description?: string
    invoices: Invoice[]
    type: "flagged" | "pending"
}

export function AlertCardList({ title, description, invoices, type }: AlertCardListProps) {

    // Helper for visual styles based on type
    const getStyles = () => {
        switch (type) {
            case "flagged":
                return {
                    icon: AlertTriangle,
                    badge: "bg-amber-100 text-amber-700",
                    border: "border-l-4 border-l-amber-500",
                    button: "bg-blue-600 hover:bg-blue-700 text-white"
                }
            case "pending":
            default:
                return {
                    icon: Clock,
                    badge: "bg-gray-100 text-gray-700",
                    border: "border-gray-200",
                    button: "bg-gray-900 text-white hover:bg-gray-800"
                }
        }
    }

    const styles = getStyles()
    const Icon = styles.icon

    return (
        <Card className="h-full border shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    <CardTitle className="text-base font-bold">{title}</CardTitle>
                </div>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {invoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center border-2 border-dashed rounded-lg">
                            No items found
                        </p>
                    ) : (
                        invoices.slice(0, 3).map(invoice => (
                            <div key={invoice.id || invoice._id} className={`flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm ${type !== 'pending' ? styles.border : ''}`}>
                                <div>
                                    <p className="font-bold text-sm">{invoice.invoiceNumber || invoice.invoiceNo}</p>
                                    <Badge className={`mt-1 h-5 text-[10px] px-1.5 font-bold border-0 ${styles.badge}`}>
                                        {type === 'flagged' ? 'Flagged' : 'Pending'}
                                    </Badge>
                                </div>

                                {type === 'pending' && (
                                    <div className="text-sm text-muted-foreground">
                                    </div>
                                )}

                                <Link href={`/company/manager/invoices/${invoice.id || invoice._id}`}>
                                    <Button size="sm" className={`h-8 text-xs font-bold ${styles.button}`}>
                                        {type === 'pending' ? 'Pending' : 'View'}
                                    </Button>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
