"use client"

import { StatsCard } from "@/features/super-admin/dashboard/components/StatsCard"
import { FileText, CheckCircle, AlertTriangle, Clock, Users, TrendingUp } from "lucide-react"

interface ManagerStatsProps {
    totalInvoices: number
    flaggedCount: number
    employeeCount: number
    totalValue: number
}

export function ManagerStats({ totalInvoices, flaggedCount, employeeCount, totalValue }: ManagerStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
                title="Total Invoices"
                value={totalInvoices}
                icon={FileText}
                description={`$${totalValue.toLocaleString()} total`}
            />
            <StatsCard
                title="Flagged Items"
                value={flaggedCount}
                icon={AlertTriangle}
                description="Requires attention"
            />
            <StatsCard
                title="Employees"
                value={employeeCount}
                icon={Users}
                description="Active team members"
            />
            <StatsCard
                title="This Month"
                value={`$${(totalValue * 0.3).toLocaleString()}`}
                icon={TrendingUp}
                description="Invoice volume"
            />
        </div>
    )
}
