"use client"

import { ManagerStats } from "@/components/dashboard/ManagerStats"
import { ManagerRecentInvoices } from "@/components/dashboard/ManagerRecentInvoices"
import { ManagerAIAlerts } from "@/components/dashboard/ManagerAIAlerts"
import { useManagerDashboard } from "@/hooks/company-manager/dashboard/use-manager-dashboard"

export default function CompanyManagerDashboard() {
  const {
    companyInvoicesCount,
    flaggedInvoicesCount,
    employeeCount,
    totalValue,
    recentInvoices,
    flaggedInvoices
  } = useManagerDashboard()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-foreground">Welcome back, User</h2>
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
          <ManagerRecentInvoices invoices={recentInvoices} description="Latest invoice submissions for your decision" />
        </div>
        <div className="space-y-4">
          {/* Flagged Items Section */}
          <ManagerAIAlerts invoices={flaggedInvoices} />
        </div>
      </div>
    </div>
  )
}
