"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RiskAnalysisProps {
    averageRiskScore: number
    cleanCount: number
    flaggedCount: number
    fraudRate: number
    fraudCount: number
    totalInvoices: number
}

export function RiskAnalysis({
    averageRiskScore,
    cleanCount,
    flaggedCount,
    fraudRate,
    fraudCount,
    totalInvoices
}: RiskAnalysisProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Risk Analysis</CardTitle>
                <CardDescription>Average risk scores and fraud detection metrics</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Average Risk Score</span>
                            <span className="font-medium">
                                {(averageRiskScore * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3">
                            <div
                                className="bg-gradient-to-r from-primary to-warning h-3 rounded-full"
                                style={{
                                    width: `${averageRiskScore * 100}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-secondary/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-primary">
                                {cleanCount}
                            </p>
                            <p className="text-sm text-muted-foreground">Clean by AI</p>
                        </div>
                        <div className="p-4 bg-secondary/50 rounded-lg text-center">
                            <p className="text-3xl font-bold text-warning">
                                {flaggedCount}
                            </p>
                            <p className="text-sm text-muted-foreground">Flagged by AI</p>
                        </div>
                    </div>

                    <div className="p-4 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium mb-1">Fraud Detection Rate</p>
                        <p className="text-2xl font-bold text-primary">
                            {fraudRate.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {fraudCount} fraudulent out of {totalInvoices} invoices
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
