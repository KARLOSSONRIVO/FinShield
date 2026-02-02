"use client"

import { StatsCard } from "@/components/dashboard/StatsCard"
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
                value={676}
                icon={FileText}
                description="+67 from last month"
            />
            <StatsCard
                title="Flagged Items"
                value={69}
                icon={AlertTriangle}
                description="Needs attention"
                iconClassName="text-red-500"
            />
            <StatsCard
                title="Active Employees"
                value={28008}
                icon={Users}
                description="Manage all employees"
                iconClassName="text-amber-500"
            />
            <StatsCard
                title="Month Invoice Volume"
                value="$14,420.76"
                icon={CheckCircle}
                description="%21 Verification"
                iconClassName="text-emerald-500"
            />
        </div>
    )
}
