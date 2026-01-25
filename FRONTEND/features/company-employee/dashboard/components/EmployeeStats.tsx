"use client"

import { StatsCard } from "@/features/super-admin/dashboard/components/StatsCard"
import { FileText, Clock, AlertTriangle, CheckCircle } from "lucide-react"
import { useEmployeeDashboard } from "@/features/company-employee/dashboard/hooks/useEmployeeDashboard"

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
                title="My Invoices"
                value={myInvoicesCount}
                icon={FileText}
                description={`$${totalValue.toLocaleString()} total`}
            />
            <StatsCard
                title="Pending Review"
                value={pendingCount}
                icon={Clock}
                description="Awaiting auditor"
            />
            <StatsCard
                title="Verified"
                value={verifiedCount}
                icon={CheckCircle}
                description="Approved invoices"
            />
            <StatsCard
                title="Flagged"
                value={flaggedCount}
                icon={AlertTriangle}
                description="Requires attention"
            />
        </div>
    )
}
