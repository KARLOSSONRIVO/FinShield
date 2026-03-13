"use client"

import { FileText, Link2, AlertTriangle, ScrollText } from "lucide-react"
import { useRegulatorDashboard } from "@/hooks/dashboard/use-regulator-dashboard"

export function RegulatorStats() {
    const {
        totalInvoices,
        totalValue,
        verifiedOnChain,
        flaggedCount,
        companiesCount
    } = useRegulatorDashboard()

    const renderCard = (title: string, value: string | number, description: string, icon: React.ReactNode, colorClass: string, bgGlow: string) => (
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-black/10 dark:hover:border-white/10">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-150 ${bgGlow}`} />
            <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
                    <h3 className="text-4xl font-black tracking-tight text-foreground">{value}</h3>
                    <p className="text-sm text-muted-foreground/80">{description}</p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm border border-border/50 ring-1 ring-black/5 dark:ring-white/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorClass}`}>
                    {icon}
                </div>
            </div>
        </div>
    )

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderCard("Total Companies", companiesCount.toLocaleString(), "Registered organizations", <ScrollText className="h-7 w-7" />, "text-[#3b5998]", "bg-[#3b5998]")}
            {renderCard("Total Invoices", totalInvoices.toLocaleString(), `₱${(totalValue || 0).toLocaleString()} total value`, <FileText className="h-7 w-7" />, "text-emerald-600", "bg-emerald-600")}
            {renderCard("Blockchain Verified", verifiedOnChain.toLocaleString(), "Tamper-proof records", <Link2 className="h-7 w-7" />, "text-indigo-500", "bg-indigo-500")}
            {renderCard("Flagged Invoices", flaggedCount.toLocaleString(), "Awaiting review", <AlertTriangle className="h-7 w-7" />, "text-red-500", "bg-red-500")}
        </div>
    )
}