"use client"

import { StatsCard } from "@/components/dashboard/StatsCard"
import { FileText, Clock, AlertTriangle, CheckCircle } from "lucide-react"

interface EmployeeStatsProps {
    myInvoicesCount: number
    pendingCount: number
    verifiedCount: number
    flaggedCount: number
    totalValue: number
}

export function EmployeeStats({
    myInvoicesCount,
    pendingCount,
    verifiedCount,
    flaggedCount,
    totalValue,
}: EmployeeStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
                title="Total Invoices"
                value={myInvoicesCount}
                description="+67 from last month"
                icon={FileText}
            />
            <StatsCard
                title="Verified"
                value={verifiedCount}
                description="%21 Verification"
                icon={CheckCircle}
                iconClassName="text-emerald-500"
            />
            <StatsCard
                title="Pending"
                value={pendingCount}
                description="Awaiting review"
                icon={Clock}
                iconClassName="text-amber-500"
            />
            <StatsCard
                title="Flagged"
                value={flaggedCount}
                description="Needs attention"
                icon={AlertTriangle}
                iconClassName="text-red-500"
            />
        </div>
    )
}
