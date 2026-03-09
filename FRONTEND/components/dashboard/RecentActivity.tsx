"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, type LucideIcon } from "lucide-react"
import type { AuditLog } from "@/lib/types"

interface RecentActivityProps {
    logs: AuditLog[]
    title?: string
    icon?: LucideIcon
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "just now"
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} hour${hrs !== 1 ? "s" : ""} ago`
    const days = Math.floor(hrs / 24)
    return `${days} day${days !== 1 ? "s" : ""} ago`
}

export function RecentActivity({ logs, title = "Recent Activity", icon: Icon = Activity }: RecentActivityProps) {
    const displayLogs = logs.slice(0, 6)

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4" />
                    {title}
                </CardTitle>
                <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
                {displayLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl">
                        No recent activity
                    </p>
                ) : (
                    <div className="space-y-3">
                        {displayLogs.map((log) => (
                            <div key={log.id} className="p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors bg-card">
                                <p className="font-bold text-base leading-snug">
                                    {log.action?.replace(/_/g, " ")}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    by {(log as any).actorRole ?? "System"} • {log.actor?.username ?? log.actor?.email ?? "Unknown"}{log.createdAt ? ` • ${timeAgo(log.createdAt)}` : ""}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
