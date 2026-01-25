"use client"

import { StatsCard } from "@/features/super-admin/dashboard/components/StatsCard"
import { Building2, FileText, AlertTriangle, CheckCircle } from "lucide-react"

import { RecentInvoices } from "@/features/super-admin/dashboard/components/RecentInvoices"
import { RecentActivity } from "@/features/super-admin/dashboard/components/RecentActivity"
import { useDashboard } from "@/features/super-admin/dashboard/hooks/useDashboard"

export default function SuperAdminDashboard() {
  const {
    companiesCount,
    totalUsers,
    totalInvoices,
    totalValue,
    flaggedCount,
    recentLogs,
    recentInvoices
  } = useDashboard()

  return (
    <>
      {/* Welcome Message */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back, <span className="text-primary">User</span></h2>
        <p className="text-muted-foreground">Full Platform Overview and Status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Companies"
          value={companiesCount}
          icon={Building2}
          description="Active Organizations"
        />
        <StatsCard
          title="Verified Users"
          value={totalUsers}
          icon={CheckCircle}
          description="Across all organizations"
          className="text-foreground"
        />
        <StatsCard
          title="Total Invoices"
          value={totalInvoices}
          icon={FileText}
          description={`$${totalValue.toLocaleString()} total value`}
        />
        <StatsCard
          title="Flagged / Alert"
          value={flaggedCount}
          icon={AlertTriangle}
          description="Needs attention"
        />
      </div>

      {/* Main Content Split: Recent Invoices (Left) & Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
        {/* Recent Invoices - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <RecentInvoices invoices={recentInvoices} />
        </div>

        {/* Recent Activity - Takes up 1 column */}
        <div className="lg:col-span-1">
          <RecentActivity logs={recentLogs} />
        </div>
      </div>
    </>
  )
}
