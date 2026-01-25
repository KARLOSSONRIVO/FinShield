"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "lucide-react"

interface StatusCounts {
    verified: number
    pending: number
    flagged: number
    fraudulent: number
}

interface StatusBreakdownProps {
    counts: StatusCounts
    total: number
}

export function StatusBreakdown({ counts, total }: StatusBreakdownProps) {
    const getPercentage = (count: number) => {
        return total > 0 ? (count / total) * 100 : 0
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Invoice Status Breakdown
                </CardTitle>
                <CardDescription>Distribution of invoice statuses</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-primary" />
                            <span>Verified</span>
                        </div>
                        <span className="font-medium">{counts.verified}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${getPercentage(counts.verified)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                            <span>Pending</span>
                        </div>
                        <span className="font-medium">{counts.pending}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div
                            className="bg-muted-foreground h-2 rounded-full"
                            style={{ width: `${getPercentage(counts.pending)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-warning" />
                            <span>Flagged</span>
                        </div>
                        <span className="font-medium">{counts.flagged}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div
                            className="bg-warning h-2 rounded-full"
                            style={{ width: `${getPercentage(counts.flagged)}%` }}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-destructive" />
                            <span>Fraudulent</span>
                        </div>
                        <span className="font-medium">{counts.fraudulent}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                        <div
                            className="bg-destructive h-2 rounded-full"
                            style={{ width: `${getPercentage(counts.fraudulent)}%` }}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
