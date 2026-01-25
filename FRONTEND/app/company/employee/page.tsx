"use client"

import { EmployeeSidebar } from "@/features/company-employee/navigation-bar/EmployeeSidebar"
import { User } from "lucide-react"

import { EmployeeStats } from "@/features/company-employee/dashboard/components/EmployeeStats"
import { EmployeeRecentInvoices } from "@/features/company-employee/dashboard/components/EmployeeRecentInvoices"
import { EmployeeAIAlerts } from "@/features/company-employee/dashboard/components/EmployeeAIAlerts"
import { useEmployeeDashboard } from "@/features/company-employee/dashboard/hooks/useEmployeeDashboard"

export default function EmployeeDashboard() {
  const {
    myInvoicesCount,
    pendingCount,
    verifiedCount,
    flaggedCount,
    totalValue,
    recentInvoices,
    flaggedInvoices
  } = useEmployeeDashboard()

  return (
    <div className="flex h-screen">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Employee Dashboard
            </h1>
            <p className="text-muted-foreground">Welcome back, John Doe</p>
          </div>

          <EmployeeStats
            myInvoicesCount={myInvoicesCount}
            pendingCount={pendingCount}
            verifiedCount={verifiedCount}
            flaggedCount={flaggedCount}
            totalValue={totalValue}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmployeeRecentInvoices invoices={recentInvoices} title="My Recent Invoices" description="Your latest submissions" />
            <EmployeeAIAlerts invoices={flaggedInvoices} />
          </div>
        </div>
      </main>
    </div>
  )
}
