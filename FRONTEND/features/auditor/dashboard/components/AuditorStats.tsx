"use client"

import { StatsCard } from "@/features/super-admin/dashboard/components/StatsCard"
import { FileSearch, CheckCircle, AlertTriangle, Clock, FileText } from "lucide-react"

interface AuditorStatsProps {
    assignedCount: number
    pendingCount: number
    flaggedCount: number
    verifiedCount: number
}

export function AuditorStats({ assignedCount, pendingCount, flaggedCount, verifiedCount }: AuditorStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
                title="Assigned Companies"
                value={assignedCount}
                icon={FileSearch}
                description="Active assignments"
            />
            <StatsCard
                title="Pending Reviews"
                value={pendingCount}
                icon={FileText}
                description="Awaiting your decision"
            />
            <StatsCard
                title="Flagged Items"
                value={flaggedCount}
                icon={AlertTriangle}
                description="Requires attention"
            />
            <StatsCard
                title="Verified"
                value={verifiedCount}
                icon={CheckCircle}
                description="Completed reviews"
            />
        </div>
    )
}
