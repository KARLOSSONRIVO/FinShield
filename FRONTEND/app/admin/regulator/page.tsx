"use client"

import { RegulatorSidebar } from "@/features/regulator/navigation-bar/RegulatorSidebar"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"

import { RegulatorStats } from "@/features/regulator/dashboard/components/RegulatorStats"
import { RecentInvoices } from "@/features/regulator/dashboard/components/RecentInvoices"
import { RecentActivity } from "@/features/regulator/dashboard/components/RecentActivity"
import { useRegulatorDashboard } from "@/features/regulator/dashboard/hooks/useRegulatorDashboard"

export default function RegulatorDashboard() {
  const {
    companiesCount,
    verifiedOnChain,
    totalValue,
    fraudulentCount,
    recentLogs,
    recentInvoices,
    totalInvoices
  } = useRegulatorDashboard()

  return (
    <div className="flex h-screen">
      <RegulatorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Regulator Dashboard
            </h1>
            <p className="text-muted-foreground">Read-only compliance oversight</p>
            <Badge variant="outline" className="mt-2">
              Read-Only Access
            </Badge>
          </div>

          <RegulatorStats
            companiesCount={companiesCount}
            totalInvoices={totalInvoices}
            totalValue={totalValue}
            verifiedOnChain={verifiedOnChain}
            fraudulentCount={fraudulentCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentInvoices invoices={recentInvoices} />
            <RecentActivity logs={recentLogs} />
          </div>
        </div>
      </main>
    </div>
  )
}
