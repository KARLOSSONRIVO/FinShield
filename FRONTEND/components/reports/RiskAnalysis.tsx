"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface RiskAnalysisProps {
    averageRiskScore: number
    verifiedCount: number
    flaggedCount: number
    fraudRate: number
    fraudCount: number
    totalInvoices: number
}

export function RiskAnalysis({
    averageRiskScore,
    verifiedCount,
    flaggedCount,
    fraudRate,
    fraudCount,
    totalInvoices
}: RiskAnalysisProps) {
    return (
        <Card className="h-full border-2 border-black/5 shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                    {/* Placeholder for Brain Icon or similar */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                    >
                        <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                        <path d="M5 12h.01" />
                        <path d="M19 12h.01" />
                        <path d="M12 2a10 10 0 1 0 0 20" />
                    </svg>
                    AI Risk Analysis
                </CardTitle>
                <CardDescription>Automated anomalous detection results</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-foreground">Average Risk Score</span>
                            <span className="font-bold">
                                {averageRiskScore.toFixed(0)}%
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-3 border border-black/5">
                            <div
                                className="bg-gradient-to-r from-yellow-400 to-emerald-500 h-3 rounded-full"
                                style={{
                                    width: `${averageRiskScore}%`,
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-600 rounded-lg text-center text-white">
                            <p className="text-2xl font-bold mb-0">
                                {verifiedCount}
                            </p>
                            <p className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Verified by AI</p>
                        </div>
                        <div className="p-4 bg-amber-500 rounded-lg text-center text-white">
                            <p className="text-2xl font-bold mb-0">
                                {flaggedCount}
                            </p>
                            <p className="text-[10px] font-medium opacity-90 uppercase tracking-wide">Flagged by AI</p>
                        </div>
                    </div>

                    <div className="p-4 bg-emerald-700/90 rounded-lg text-white">
                        <p className="text-[10px] font-bold mb-0 uppercase tracking-wide opacity-90">Fraud Detection Rate</p>
                        <p className="text-xl font-bold mb-0">
                            {fraudRate.toFixed(1)}%
                        </p>
                        <p className="text-[10px] opacity-80 mt-1">
                            {fraudCount} flagged out of {totalInvoices} invoices
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
