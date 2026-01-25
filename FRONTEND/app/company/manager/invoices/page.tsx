"use client"

import { useMemo } from "react"
import { ManagerSidebar } from "@/features/company-manager/navigation-bar/ManagerSidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockInvoices } from "@/lib/mock-data"
import { FileText, Search } from "lucide-react"
import { useSearchFilter } from "@/hooks"
import { ManagerInvoicesTable } from "@/features/company-manager/invoices/components/ManagerInvoicesTable"

export default function ManagerInvoicesPage() {
  // Pre-filter company invoices
  const companyInvoices = useMemo(
    () => mockInvoices.filter((i) => i.companyOrgId === "org-company-1"),
    []
  )

  // Use the search filter hook
  const { search, setSearch, statusFilter, setStatusFilter, filteredItems: filteredInvoices } = useSearchFilter({
    items: companyInvoices,
    searchFields: ["invoiceNo"],
    statusField: "status",
  })

  return (
    <div className="flex h-screen">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Company Invoices
            </h1>
            <p className="text-muted-foreground">All invoices for Acme Corporation</p>
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <ManagerInvoicesTable
                invoices={filteredInvoices}
                linkPrefix="/company/manager/invoices"
                showUploadedBy={true}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
