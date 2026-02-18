"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card'
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
        <Card className="h-full border-2 border-black/5 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                    <PieChart className="h-5 w-5" />
                    Invoice Status Breakdown
                </CardTitle>
                <CardDescription>Distribution of invoice statuses</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span className="font-bold">Verified</span>
                            </div>
                            <span className="font-bold">{counts.verified}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                            <div
                                className="bg-emerald-500 h-3 rounded-full"
                                style={{ width: `${getPercentage(counts.verified)}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-gray-400" />
                                <span className="font-bold">Pending</span>
                            </div>
                            <span className="font-bold">{counts.pending}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                            <div
                                className="bg-gray-400 h-3 rounded-full"
                                style={{ width: `${getPercentage(counts.pending)}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="font-bold">Flagged</span>
                            </div>
                            <span className="font-bold">{counts.flagged}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                            <div
                                className="bg-amber-500 h-3 rounded-full"
                                style={{ width: `${getPercentage(counts.flagged)}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="font-bold">Fraudulent</span>
                            </div>
                            <span className="font-bold">{counts.fraudulent}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                            <div
                                className="bg-red-500 h-3 rounded-full"
                                style={{ width: `${getPercentage(counts.fraudulent)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
