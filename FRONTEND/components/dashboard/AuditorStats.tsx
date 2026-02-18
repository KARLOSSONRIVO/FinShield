"use client"

import { StatsCard } from "@/components/dashboard/StatsCard"
import { FileText, CheckCircle, Clock, AlertTriangle } from "lucide-react"

interface StatItem {
    label: string
    value: number
    change: string
    trend: string
}

interface AuditorStatsProps {
    stats: StatItem[]
}

export function AuditorStats({ stats }: AuditorStatsProps) {
    if (!stats || stats.length < 4) return null

    
    
    

    
    
    
    
    

    
    

    const totalItem = stats.find(s => s.label.includes("Total") || s.label.includes("Assigned")) || stats[3]
    const verifiedItem = stats.find(s => s.label.includes("Verified")) || stats[2]
    const pendingItem = stats.find(s => s.label.includes("Pending")) || stats[0]
    const flaggedItem = stats.find(s => s.label.includes("Flagged")) || stats[1]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
                title={totalItem?.label || "Assigned Companies"}
                value={totalItem?.value || 0}
                description={`${totalItem?.change || "0"} from last month`}
                icon={FileText}
            />
            <StatsCard
                title={verifiedItem?.label || "Verified Reviews"}
                value={verifiedItem?.value || 0}
                description={verifiedItem?.change || ""}
                icon={CheckCircle}
                iconClassName="text-emerald-500"
            />
            <StatsCard
                title={pendingItem?.label || "Pending Reviews"}
                value={pendingItem?.value || 0}
                description={pendingItem?.change || ""}
                icon={Clock}
                iconClassName="text-orange-500"
            />
            <StatsCard
                title={flaggedItem?.label || "Flagged Items"}
                value={flaggedItem?.value || 0}
                description={flaggedItem?.change || ""}
                icon={AlertTriangle}
                iconClassName="text-destructive"
            />
        </div>
    )
}
