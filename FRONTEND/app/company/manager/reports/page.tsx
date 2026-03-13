"use client"


import { Button } from "@/components/ui/button"
import { FileBarChart } from "lucide-react"

import { FinancialOverview } from "@/components/reports/FinancialOverview"
import { StatusBreakdown } from "@/components/reports/StatusBreakdown"
import { RiskAnalysis } from "@/components/reports/RiskAnalysis"
import { useManagerReports } from "@/hooks/company-manager/reports/use-manager-reports"
import { DashboardContentSkeleton } from "@/components/skeletons/dashboard-content-skeleton"

export default function ManagerReportsPage() {
  const { metrics, statusCounts, riskMetrics, totalCount, isLoading } = useManagerReports()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Company Reports
          </h1>
        </div>
      </div>

      {isLoading ? (
        <DashboardContentSkeleton />
      ) : (
        <>
          <FinancialOverview
            total={metrics.totalValue}
            verifiedValue={metrics.verifiedValue}
            flagged={metrics.flaggedValue}
            fraudValue={metrics.flaggedValue}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusBreakdown counts={statusCounts} total={totalCount} />
            <RiskAnalysis
              averageRiskScore={riskMetrics.averageRiskScore}
              verifiedCount={riskMetrics.verifiedCount}
              flaggedCount={riskMetrics.aiFlaggedCount}
              fraudRate={riskMetrics.fraudRate}
              fraudCount={riskMetrics.fraudCount}
              totalInvoices={totalCount}
            />
          </div>
        </>
      )}
    </div>
  )
}
