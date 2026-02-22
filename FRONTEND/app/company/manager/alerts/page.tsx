"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, TrendingUp, XCircle, Clock } from "lucide-react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { AlertCardList } from "@/components/alerts/AlertCardList"


export default function ManagerAlertsPage() {
  // Mock data filtering
  const companyInvoices: any[] = []
  const flaggedInvoices: any[] = []
  const fraudulentInvoices: any[] = []
  const pendingInvoices: any[] = []
  const highRiskInvoices: any[] = []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
      </div>

      {/* Stats Logic matched to screenshot: Flagged Invoices Section */}
      <div className="space-y-2">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Flagged Items"
            value={flaggedInvoices.length}
            icon={AlertTriangle}
            iconClassName="text-amber-500"
            className="border-l-4 border-l-amber-500"
          />
          <StatsCard
            title="Fraudulent Items"
            value={fraudulentInvoices.length}
            icon={XCircle}
            iconClassName="text-red-500"
            className="border-l-4 border-l-red-500"
          />
          <StatsCard
            title="High-Risk"
            value={highRiskInvoices.length}
            icon={TrendingUp}
            iconClassName="text-blue-500"
            className="border-l-4 border-l-blue-500"
          />
          <StatsCard
            title="Pending"
            value={pendingInvoices.length}
            icon={Clock}
            iconClassName="text-gray-500"
            className="border-l-4 border-l-gray-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertCardList
          title="AI Fraud Flagged"
          description="Invoices flagged by AI"
          invoices={fraudulentInvoices}
          type="fraudulent"
        />
        <AlertCardList
          title="AI Fraud Flagged"
          description="Invoices flagged by AI"
          invoices={flaggedInvoices}
          type="flagged"
        />
      </div>

      {/* Pending Review Full Width */}
      <div className="w-full">
        <AlertCardList
          title="Pending Review"
          description="Invoices waiting for auditor review"
          invoices={pendingInvoices}
          type="pending"
        />
      </div>
    </div>
  )
}
