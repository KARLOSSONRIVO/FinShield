"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AIVerdictBadge, InvoiceStatusBadge } from "@/components/common/StatusBadge"
import type { Invoice } from "@/lib/types"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertSectionProps {
    title: string
    description: string
    icon: LucideIcon
    invoices: Invoice[]
    variant?: "default" | "destructive" | "warning"
    linkPrefix: string
}

export function ManagerAlertSection({
    title,
    description,
    icon: Icon,
    invoices,
    variant = "default",
    linkPrefix,
}: AlertSectionProps) {
    const colorClass =
        variant === "destructive" ? "text-destructive" :
            variant === "warning" ? "text-warning" :
                "text-foreground"

    const borderColorClass =
        variant === "destructive" ? "border-destructive/50" :
            variant === "warning" ? "border-warning/50" :
                ""

    const itemBgClass =
        variant === "destructive" ? "bg-destructive/10 border-l-2 border-destructive" :
            variant === "warning" ? "bg-warning/10 border-l-2 border-warning" :
                "bg-secondary/50"

    return (
        <Card className={borderColorClass}>
            <CardHeader>
                <CardTitle className={cn("flex items-center gap-2", colorClass)}>
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {invoices.length > 0 ? (
                    <div className="space-y-4">
                        {invoices.map((invoice) => (
                            <div
                                key={invoice._id}
                                className={cn("flex items-center justify-between p-3 rounded-lg", itemBgClass)}
                            >
                                <div>
                                    <p className="font-medium">{invoice.invoiceNo}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {invoice.uploadedByName ? `by ${invoice.uploadedByName}` : ""}
                                        {invoice.uploadedByName && variant !== "default" ? " - " : ""}
                                        ${invoice.totals_total.toLocaleString()}
                                        {variant === "default" && ` - ${new Date(invoice.invoiceDate).toLocaleDateString()}`}
                                    </p>
                                    {variant === "warning" && (
                                        <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                                    )}
                                </div>
                                {variant === "default" && (
                                    <div className="mr-4">
                                        <InvoiceStatusBadge status={invoice.status} />
                                    </div>
                                )}
                                <Link href={`${linkPrefix}/${invoice._id}`}>
                                    <Button variant="outline" size="sm">
                                        View
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No invoices found</p>
                )}
            </CardContent>
        </Card>
    )
}
