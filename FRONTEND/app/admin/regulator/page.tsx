"use client"

import { useAuth } from "@/hooks/global/use-auth"
import { RegulatorStats } from "@/components/dashboard/RegulatorStats"
import { RecentInvoices } from "@/components/dashboard/RecentInvoices"
import { BlockchainRecentInvoices } from "@/components/dashboard/BlockchainRecentInvoices"
import { useRegulatorDashboard } from "@/hooks/dashboard/use-regulator-dashboard"
import { DashboardContentSkeleton } from "@/components/skeletons/dashboard-content-skeleton"

export default function RegulatorDashboard() {
  const { user } = useAuth()
  const shouldFetch = !user?.mustChangePassword

  const {
    companiesCount,
    verifiedOnChain,
    totalValue,
    flaggedCount,
    recentInvoices,
    totalInvoices,
    isLoading
  } = useRegulatorDashboard({ enabled: shouldFetch })

  if (!shouldFetch) {
    return null
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Regulator Dashboard
        </h1>
      </div>

      {isLoading ? (
        <DashboardContentSkeleton />
      ) : (
        <>
          <RegulatorStats />

          <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
            <div className="lg:col-span-4">
              <RecentInvoices invoices={recentInvoices} />
            </div>
            <div className="lg:col-span-4">
              <BlockchainRecentInvoices />
            </div>
          </div>
        </>
      )}
    </>
  )
}