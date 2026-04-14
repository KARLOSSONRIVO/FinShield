"use client"

import { useAuth } from "@/hooks/global/use-auth"
import { ManagerStats } from "@/components/dashboard/ManagerStats"
import { RecentInvoices } from "@/components/dashboard/RecentInvoices"
import { useManagerDashboard } from "@/hooks/company-manager/dashboard/use-manager-dashboard"

import { DashboardContentSkeleton } from "@/components/skeletons/dashboard-content-skeleton"

export default function CompanyManagerDashboard() {
  const { user } = useAuth()
  const shouldFetch = !user?.mustChangePassword

  const {
    companyInvoicesCount,
    flaggedInvoicesCount,
    employeeCount,
    totalValue,
    recentInvoices,
    flaggedInvoices,
    isLoading
  } = useManagerDashboard({ enabled: shouldFetch })

  if (!shouldFetch) {
    return null
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <DashboardContentSkeleton />
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-foreground">
              Welcome back, {user?.username || "Manager"}
            </h2>
            <p className="text-sm text-muted-foreground">Here's what's happening with your invoices</p>
          </div>

          <ManagerStats
            totalInvoices={companyInvoicesCount}
            flaggedCount={flaggedInvoicesCount}
            employeeCount={employeeCount}
            totalValue={totalValue}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Pending Reviews Section - Using Recent Invoices as placeholder for now, styled as 'Pending Reviews' */}
              <RecentInvoices invoices={recentInvoices} description="Latest invoice submissions for your decision" />
            </div>
            <div className="space-y-4">
              {/* Flagged Items Section */}
              <RecentInvoices invoices={flaggedInvoices} title="Flagged Items" description="High-risk invoices that require your immediate attention" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}