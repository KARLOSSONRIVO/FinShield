"use client"

import { RegulatorSidebar } from "@/features/regulator/navigation-bar/RegulatorSidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Search } from "lucide-react"

import { RegulatorInvoiceTable } from "@/features/regulator/invoices/components/RegulatorInvoiceTable"
import { useRegulatorInvoices, InvoiceStatusFilter } from "@/features/regulator/invoices/hooks/useRegulatorInvoices"

export default function RegulatorInvoicesPage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    filteredInvoices
  } = useRegulatorInvoices()

  return (
    <div className="flex h-screen">
      <RegulatorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              All Invoices
            </h1>
            <p className="text-muted-foreground">Read-only view of all platform invoices</p>
            <Badge variant="outline" className="mt-2">
              Read-Only Access
            </Badge>
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
              <RegulatorInvoiceTable invoices={filteredInvoices} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
