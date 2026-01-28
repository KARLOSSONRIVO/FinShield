"use client"

import { FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface AuditorStatsProps {
    stats: {
        assignedCompanies: number
        assignedIncrease: number
        verifiedReviews: number
        verifiedPercentage: number
        pendingReviews: number
        pendingStatus: string
        flaggedItems: number
        flaggedStatus: string
    }
}

export function AuditorStats({ stats }: AuditorStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatItem
                title="Assigned Companies"
                value={stats.assignedCompanies}
                subtext={`+${stats.assignedIncrease} from last month`}
                icon={FileText}
            />
            <StatItem
                title="Verified Reviews"
                value={stats.verifiedReviews}
                subtext={`%${stats.verifiedPercentage} Verification`}
                subtextColor="text-emerald-600"
                icon={CheckCircle}
                iconColor="text-emerald-600"
            />
            <StatItem
                title="Pending Reviews"
                value={stats.pendingReviews}
                subtext={stats.pendingStatus}
                subtextColor="text-orange-500"
                icon={Clock}
                iconColor="text-orange-500"
            />
            <StatItem
                title="Flagged Items"
                value={stats.flaggedItems}
                subtext={stats.flaggedStatus}
                subtextColor="text-destructive"
                icon={AlertTriangle}
                iconColor="text-destructive"
            />
        </div>
    )
}

function StatItem({ title, value, subtext, subtextColor = "text-muted-foreground", icon: Icon, iconColor = "text-foreground" }: any) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold">{title}</span>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="text-3xl font-bold mb-1">{value.toLocaleString()}</div>
                <div className={`text-xs font-bold ${subtextColor}`}>{subtext}</div>
            </CardContent>
        </Card>
    )
}
