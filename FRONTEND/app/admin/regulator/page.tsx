"use client"




import { RegulatorStats } from "@/components/dashboard/RegulatorStats"
import { RecentInvoices } from "@/components/dashboard/RecentInvoices"
import { RecentActivity } from "@/components/dashboard/RecentActivity"
import { Eye } from "lucide-react"
import { useRegulatorDashboard } from "@/hooks/dashboard/use-regulator-dashboard"

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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Regulator Dashboard
        </h1>
      </div>

      <RegulatorStats
        companiesCount={companiesCount}
        totalInvoices={totalInvoices}
        totalValue={totalValue}
        verifiedOnChain={verifiedOnChain}
        fraudulentCount={fraudulentCount}
      />

      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        <div className="lg:col-span-5">
          <RecentInvoices invoices={recentInvoices} />
        </div>
        <div className="lg:col-span-3">
          <RecentActivity logs={recentLogs} title="System Activity" icon={Eye} />
        </div>
      </div>
    </>
  )
}
