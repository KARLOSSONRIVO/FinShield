"use client"



interface FinancialOverviewProps {
    total: number
    verified: number
    flagged: number
    fraudulent: number
}

import { StatsCard } from "@/components/dashboard/StatsCard"
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

interface FinancialOverviewProps {
    total: number
    verified: number
    flagged: number
    fraudulent: number
}

export function FinancialOverview({ total, verified, flagged, fraudulent }: FinancialOverviewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
                title="Total Invoice Value"
                value={`$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={DollarSign}
                iconClassName="text-emerald-500"
                className="border-l-4 border-l-emerald-500"
            />
            <StatsCard
                title="Total Invoice Value" 
                value={`$${verified.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingUp}
                iconClassName="text-emerald-500"
                className="border-l-4 border-l-emerald-500"
            />
            <StatsCard
                title="Flagged Value"
                value={`$${flagged.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingDown}
                iconClassName="text-amber-500"
                className="border-l-4 border-l-amber-500"
            />
            <StatsCard
                title="Fraud Loss"
                value={`$${fraudulent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingDown}
                iconClassName="text-red-500"
                className="border-l-4 border-l-red-500"
            />
        </div>
    )
}
