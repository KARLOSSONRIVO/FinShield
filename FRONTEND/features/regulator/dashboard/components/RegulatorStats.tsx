"use client"

import { StatsCard } from "@/features/super-admin/dashboard/components/StatsCard"
import { Building2, FileText, Blocks, AlertTriangle, Users, Link2 } from "lucide-react"

interface RegulatorStatsProps {
    companiesCount: number
    totalInvoices: number
    totalValue: number
    verifiedOnChain: number
    fraudulentCount: number
}

export function RegulatorStats({
    companiesCount,
    totalInvoices,
    totalValue,
    verifiedOnChain,
    fraudulentCount,
}: RegulatorStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard title="Registered Companies" value={companiesCount} icon={Users} description="On platform" />
            <StatsCard
                title="Total Invoices"
                value={totalInvoices}
                icon={FileText}
                description={`$${totalValue.toLocaleString()} total`}
            />
            <StatsCard
                title="Blockchain Verified"
                value={verifiedOnChain}
                icon={Link2}
                description="Tamper-proof records"
            />
            <StatsCard
                title="Fraud Detected"
                value={fraudulentCount}
                icon={AlertTriangle}
                description="Confirmed cases"
            />
        </div>
    )
}
