"use client"

import { ManagerSidebar } from "@/features/company-manager/navigation-bar/ManagerSidebar"
import { AlertTriangle, XCircle, Clock, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ManagerAlertSection } from "@/features/company-manager/alerts/components/ManagerAlertSection"
import { mockInvoices } from "@/lib/mock-data"

export default function ManagerAlertsPage() {
  const companyInvoices = mockInvoices.filter((i) => i.companyOrgId === "org-company-1")
  const flaggedInvoices = companyInvoices.filter((i) => i.ai_verdict === "flagged" || i.status === "flagged")
  const fraudulentInvoices = companyInvoices.filter((i) => i.status === "fraudulent")
  const pendingInvoices = companyInvoices.filter((i) => i.status === "pending")
  const highRiskInvoices = companyInvoices.filter((i) => i.ai_riskScore > 0.7)

  return (
    <div className="flex h-screen">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              Company Alerts
            </h1>
            <p className="text-muted-foreground">All company invoices requiring attention</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{fraudulentInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Fraudulent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-warning/50 bg-warning/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-warning">{flaggedInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Flagged</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{highRiskInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">High Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{pendingInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ManagerAlertSection
              title="Fraudulent Invoices"
              description="Confirmed fraudulent by auditors"
              icon={XCircle}
              invoices={fraudulentInvoices}
              variant="destructive"
              linkPrefix="/company/manager/invoices"
            />

            <ManagerAlertSection
              title="AI Flagged Invoices"
              description="Flagged for potential issues"
              icon={AlertTriangle}
              invoices={flaggedInvoices}
              variant="warning"
              linkPrefix="/company/manager/invoices"
            />

            <div className="lg:col-span-2">
              <ManagerAlertSection
                title="Pending Review"
                description="Company invoices awaiting auditor review"
                icon={Clock}
                invoices={pendingInvoices}
                linkPrefix="/company/manager/invoices"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
