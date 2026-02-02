"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, type LucideIcon } from "lucide-react"
import type { AuditLog } from "@/lib/types"

interface RecentActivityProps {
    logs: AuditLog[]
    title?: string
    icon?: LucideIcon
}

export function RecentActivity({ logs, title = "Recent Activity", icon: Icon = TrendingUp }: RecentActivityProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {title}
                </CardTitle>
                <CardDescription>Latest actions in the system</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {logs.map((log) => (
                        <div key={log._id} className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                            <div className="flex-1">
                                <p className="font-medium">{log.action.replace(/_/g, " ")}</p>
                                <p className="text-sm text-muted-foreground">
                                    by {log.actorName} • {log.entity_type}
                                </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
