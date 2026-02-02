"use client"


import { Button } from "@/components/ui/button"
import { FileBarChart, Download } from "lucide-react"

import { FinancialOverview } from "@/components/reports/FinancialOverview"
import { StatusBreakdown } from "@/components/reports/StatusBreakdown"
import { RiskAnalysis } from "@/components/reports/RiskAnalysis"
import { useManagerReports } from "@/hooks/company-manager/reports/use-manager-reports"

export default function ManagerReportsPage() {
  const { metrics, statusCounts, riskMetrics, totalCount } = useManagerReports()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Company Reports
          </h1>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <FinancialOverview
        total={metrics.totalValue}
        verified={metrics.verifiedValue}
        flagged={metrics.flaggedValue}
        fraudulent={metrics.fraudulentValue}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusBreakdown counts={statusCounts} total={totalCount} />
        <RiskAnalysis
          averageRiskScore={riskMetrics.averageRiskScore}
          cleanCount={riskMetrics.cleanCount}
          flaggedCount={riskMetrics.aiFlaggedCount}
          fraudRate={riskMetrics.fraudRate}
          fraudCount={riskMetrics.fraudCount}
          totalInvoices={totalCount}
        />
      </div>
    </div>
  )
}
