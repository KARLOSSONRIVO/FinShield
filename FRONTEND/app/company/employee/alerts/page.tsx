"use client"

import { EmployeeSidebar } from "@/features/company-employee/navigation-bar/EmployeeSidebar"
import { AlertTriangle, XCircle, Clock } from "lucide-react"
import { EmployeeAlertSection } from "@/features/company-employee/alerts/components/EmployeeAlertSection"
import { mockInvoices } from "@/lib/mock-data"

export default function EmployeeAlertsPage() {
  const myInvoices = mockInvoices.filter((i) => i.uploadedByUserId === "user-employee-1")
  const flaggedInvoices = myInvoices.filter((i) => i.ai_verdict === "flagged" || i.status === "flagged")
  const fraudulentInvoices = myInvoices.filter((i) => i.status === "fraudulent")
  const pendingInvoices = myInvoices.filter((i) => i.status === "pending")

  return (
    <div className="flex h-screen">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              Alerts
            </h1>
            <p className="text-muted-foreground">Invoices requiring your attention</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EmployeeAlertSection
              title="Marked as Fraudulent"
              description="These invoices have been flagged as fraudulent by auditors"
              icon={XCircle}
              invoices={fraudulentInvoices}
              variant="destructive"
              linkPrefix="/company/employee/invoices"
            />

            <EmployeeAlertSection
              title="AI Flagged"
              description="Invoices flagged by AI for potential issues"
              icon={AlertTriangle}
              invoices={flaggedInvoices}
              variant="warning"
              linkPrefix="/company/employee/invoices"
            />

            <div className="lg:col-span-2">
              <EmployeeAlertSection
                title="Pending Review"
                description="Invoices awaiting auditor review"
                icon={Clock}
                invoices={pendingInvoices}
                linkPrefix="/company/employee/invoices"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
