"use client"

import { AuditorSidebar } from "@/features/auditor/navigation-bar/AuditorSidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search } from "lucide-react"

import { AuditorInvoiceTable } from "@/features/auditor/invoices/components/AuditorInvoiceTable"
import { useAuditorInvoices, InvoiceStatusFilter } from "@/features/auditor/invoices/hooks/useAuditorInvoices"

export default function AuditorInvoicesPage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredInvoices
  } = useAuditorInvoices()

  return (
    <div className="flex h-screen">
      <AuditorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Assigned Invoices
            </h1>
            <p className="text-muted-foreground">Invoices from your assigned companies</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatusFilter)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                    <SelectItem value="fraudulent">Fraudulent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <AuditorInvoiceTable invoices={filteredInvoices} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
