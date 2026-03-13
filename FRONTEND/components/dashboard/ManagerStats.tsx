"use client"

import { FileText, CheckCircle, AlertTriangle, Users } from "lucide-react"

interface ManagerStatsProps {
    totalInvoices: number
    flaggedCount: number
    employeeCount: number
    totalValue: number
}

export function ManagerStats({ totalInvoices, flaggedCount, employeeCount, totalValue }: ManagerStatsProps) {
    const renderCard = (title: string, value: string | number, icon: React.ReactNode, colorClass: string, bgGlow: string) => (
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-black/10 dark:hover:border-white/10">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-150 ${bgGlow}`} />
            <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
                    <h3 className="text-4xl font-black tracking-tight text-foreground">{value}</h3>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm border border-border/50 ring-1 ring-black/5 dark:ring-white/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorClass}`}>
                    {icon}
                </div>
            </div>
        </div>
    )

    // Format total value as currency
    const formattedTotalValue = `₱${(totalValue || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderCard(
                "Total Invoices",
                totalInvoices.toLocaleString(),
                <FileText className="h-7 w-7" />,
                "text-[#3b5998]",
                "bg-[#3b5998]"
            )}
            {renderCard(
                "Flagged Items",
                flaggedCount.toLocaleString(),
                <AlertTriangle className="h-7 w-7" />,
                "text-red-500",
                "bg-red-500"
            )}
            {renderCard(
                "Active Employees",
                employeeCount.toLocaleString(),
                <Users className="h-7 w-7" />,
                "text-amber-500",
                "bg-amber-500"
            )}
            {renderCard(
                "Invoice Volume",
                formattedTotalValue,
                <CheckCircle className="h-7 w-7" />,
                "text-emerald-500",
                "bg-emerald-500"
            )}
        </div>
    )
} 