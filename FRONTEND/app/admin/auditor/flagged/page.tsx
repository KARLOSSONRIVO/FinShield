"use client"

import { AuditorSidebar } from "@/features/auditor/navigation-bar/AuditorSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

import { AuditorInvoiceTable } from "@/features/auditor/invoices/components/AuditorInvoiceTable"
import { useAuditorFlagged } from "@/features/auditor/flagged/hooks/useAuditorFlagged"

export default function AuditorFlaggedPage() {
  const { flaggedInvoices } = useAuditorFlagged()

  return (
    <div className="flex h-screen">
      <AuditorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              Flagged Queue
            </h1>
            <p className="text-muted-foreground">High-risk invoices from your assigned companies</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Flagged Invoices</CardTitle>
              <CardDescription>{flaggedInvoices.length} invoices require your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <AuditorInvoiceTable invoices={flaggedInvoices} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
