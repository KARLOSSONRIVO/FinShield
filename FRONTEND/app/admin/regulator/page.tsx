"use client"




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
          <RecentActivity logs={recentLogs} />
        </div>
      </div>
    </>
  )
}
