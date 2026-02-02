"use client"

import { FileSearch } from "lucide-react"

import { AuditorStats } from "@/components/dashboard/AuditorStats"
import { PendingReviews } from "@/components/dashboard/PendingReviews"
import { FlaggedItems } from "@/components/dashboard/FlaggedItems"
import { useAuditorDashboard } from "@/hooks/dashboard/use-auditor-dashboard"

export default function AuditorDashboard() {
  const {
    stats,
    pendingReviews,
    flaggedInvoices,
  } = useAuditorDashboard()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Dashboard
        </h1>
        <div className="mt-2">
          <h2 className="text-lg font-bold">Welcome back, <span className="text-emerald-600">User</span></h2>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your invoices</p>
        </div>
      </div>

      <AuditorStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <PendingReviews invoices={pendingReviews} />
        <FlaggedItems invoices={flaggedInvoices} />
      </div>
    </div>
  )
}
