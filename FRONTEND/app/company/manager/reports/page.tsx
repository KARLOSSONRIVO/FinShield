"use client"

import { ManagerSidebar } from "@/features/company-manager/navigation-bar/ManagerSidebar"
import { Button } from "@/components/ui/button"
import { FileBarChart, Download } from "lucide-react"

import { FinancialOverview } from "@/features/company-manager/reports/components/FinancialOverview"
import { StatusBreakdown } from "@/features/company-manager/reports/components/StatusBreakdown"
import { RiskAnalysis } from "@/features/company-manager/reports/components/RiskAnalysis"
import { useManagerReports } from "@/features/company-manager/reports/hooks/useManagerReports"

export default function ManagerReportsPage() {
  const { metrics, statusCounts, riskMetrics, totalCount } = useManagerReports()

  return (
    <div className="flex h-screen">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileBarChart className="h-6 w-6 text-primary" />
                Company Reports
              </h1>
              <p className="text-muted-foreground">Financial overview and analytics</p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
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
      </main>
    </div>
  )
}
