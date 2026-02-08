"use client"



import { useAuth } from "@/hooks/use-auth"
import { EmployeeStats } from "@/components/dashboard/EmployeeStats"
import { EmployeeRecentInvoices } from "@/components/dashboard/EmployeeRecentInvoices"
import { EmployeeAIAlerts } from "@/components/dashboard/EmployeeAIAlerts"
import { useEmployeeDashboard } from "@/hooks/company-employee/dashboard/use-employee-dashboard"

export default function EmployeeDashboard() {
  const { user } = useAuth()
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
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Welcome back, {user?.firstName || "Employee"}
          </h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your invoices</p>
        </div>
        <a href="/company/employee/upload" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-emerald-600 text-primary-foreground hover:bg-emerald-600/90 h-10 px-4 py-2">
          <span className="flex items-center gap-2">
            <span className="text-lg">+</span> Upload Invoice
          </span>
        </a>
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

  )
}
