"use client"

import { Card, CardContent } from "@/components/ui/card"
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react"

interface FinancialOverviewProps {
    total: number
    verified: number
    flagged: number
    fraudulent: number
}

export function FinancialOverview({ total, verified, flagged, fraudulent }: FinancialOverviewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Invoice Value</p>
                            <p className="text-2xl font-bold">${total.toLocaleString()}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-primary" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Verified Value</p>
                            <p className="text-2xl font-bold text-primary">${verified.toLocaleString()}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-primary" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Flagged Value</p>
                            <p className="text-2xl font-bold text-warning">${flagged.toLocaleString()}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-warning" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Fraud Loss</p>
                            <p className="text-2xl font-bold text-destructive">${fraudulent.toLocaleString()}</p>
                        </div>
                        <TrendingDown className="h-8 w-8 text-destructive" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
