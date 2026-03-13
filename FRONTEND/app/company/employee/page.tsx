"use client"

import { useAuth } from "@/hooks/global/use-auth"
import EmployeeStats from "@/components/dashboard/EmployeeStats"
import { EmployeeRecentInvoices } from "@/components/dashboard/EmployeeRecentInvoices"
import RejectedItems from "@/components/dashboard/RejectedItems"
import { useEmployeeDashboard } from "@/hooks/company-employee/dashboard/use-employee-dashboard"
import { DashboardContentSkeleton } from "@/components/skeletons/dashboard-content-skeleton"

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const shouldFetch = !user?.mustChangePassword

  const {
    myInvoicesCount,
    pendingCount,
    verifiedCount,
    rejectedCount,
    recentInvoices,
    rejectedInvoices,
    isLoading
  } = useEmployeeDashboard({ enabled: shouldFetch })

  if (!shouldFetch) {
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Welcome back, {user?.username || "Employee"}
          </h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your invoices</p>
        </div>
      </div>

      {isLoading ? (
        <DashboardContentSkeleton />
      ) : (
        <>
          <EmployeeStats
            myInvoicesCount={myInvoicesCount}
            pendingCount={pendingCount}
            verifiedCount={verifiedCount}
            rejectedCount={rejectedCount}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="space-y-4">
              <EmployeeRecentInvoices
                invoices={recentInvoices}
                title="My Recent Invoices"
                description="Your latest submissions"
              />
            </div>

            <div className="space-y-4">
              <RejectedItems invoices={rejectedInvoices} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}