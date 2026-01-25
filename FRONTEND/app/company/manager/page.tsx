"use client"

import { ManagerSidebar } from "@/features/company-manager/navigation-bar/ManagerSidebar"
import { Building2 } from "lucide-react"

import { ManagerStats } from "@/features/company-manager/dashboard/components/ManagerStats"
import { ManagerRecentInvoices } from "@/features/company-manager/dashboard/components/ManagerRecentInvoices"
import { ManagerAIAlerts } from "@/features/company-manager/dashboard/components/ManagerAIAlerts"
import { useManagerDashboard } from "@/features/company-manager/dashboard/hooks/useManagerDashboard"

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
    <div className="flex h-screen">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Company Manager Dashboard
            </h1>
            <p className="text-muted-foreground">Acme Corporation Overview</p>
          </div>

          <ManagerStats
            totalInvoices={companyInvoicesCount}
            flaggedCount={flaggedInvoicesCount}
            employeeCount={employeeCount}
            totalValue={totalValue}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ManagerRecentInvoices invoices={recentInvoices} description="Latest company submissions" />
            <ManagerAIAlerts invoices={flaggedInvoices} />
          </div>
        </div>
      </main>
    </div>
  )
}
