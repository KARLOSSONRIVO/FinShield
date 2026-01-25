"use client"

import { AuditorSidebar } from "@/features/auditor/navigation-bar/AuditorSidebar"
import { FileSearch } from "lucide-react"

import { AuditorStats } from "@/features/auditor/dashboard/components/AuditorStats"
import { PendingReviews } from "@/features/auditor/dashboard/components/PendingReviews"
import { FlaggedItems } from "@/features/auditor/dashboard/components/FlaggedItems"
import { useAuditorDashboard } from "@/features/auditor/dashboard/hooks/useAuditorDashboard"

export default function AuditorDashboard() {
  const {
    assignedCompanyIds,
    pendingReviews,
    flaggedInvoices,
    verifiedInvoices
  } = useAuditorDashboard()

  return (
    <div className="flex h-screen">
      <AuditorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileSearch className="h-6 w-6 text-primary" />
              Auditor Dashboard
            </h1>
            <p className="text-muted-foreground">Review invoices for your assigned companies</p>
          </div>

          <AuditorStats
            assignedCount={assignedCompanyIds.length}
            pendingCount={pendingReviews.length}
            flaggedCount={flaggedInvoices.length}
            verifiedCount={verifiedInvoices.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PendingReviews invoices={pendingReviews} />
            <FlaggedItems invoices={flaggedInvoices} />
          </div>
        </div>
      </main>
    </div>
  )
}
