"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { AllInvoicesTable } from "@/features/super-admin/invoices/components/AllInvoicesTable"
import { useInvoices, InvoiceStatusFilter } from "@/features/super-admin/invoices/hooks/useInvoices"
import { Pagination } from "@/components/ui/pagination-custom"
import { InvoiceFilter } from "@/features/super-admin/invoices/components/InvoiceFilter"

export default function AllInvoicesPage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    invoices,
    currentPage,
    totalPages,
    setCurrentPage,
    sortConfig,
    requestSort
  } = useInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Invoice Management</h2>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Invoices..."
            className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <InvoiceFilter
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortConfig={sortConfig}
          onSortChange={requestSort}
        />
      </div>

      <AllInvoicesTable
        invoices={invoices}
        sortConfig={sortConfig}
        onSort={requestSort}
      />

      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
