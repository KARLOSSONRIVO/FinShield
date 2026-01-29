"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { InvoiceTable } from "@/features/invoices/components/InvoiceTable"
import { useFlaggedQueue } from "@/features/super-admin/flagged/hooks/useFlaggedQueue"
import { Pagination } from "@/components/ui/pagination-custom"
import { InvoiceFilter } from "@/features/super-admin/invoices/components/InvoiceFilter"

export default function FlaggedQueuePage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    invoices,
    currentPage,
    totalPages,
    setCurrentPage,
    sortConfig, // eslint-disable-line @typescript-eslint/no-unused-vars
    requestSort // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useFlaggedQueue()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Flagged Invoices</h2>
      </div>

      <div>
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
      </div>

      <div className="mt-4">
        <InvoiceTable
          invoices={invoices}
          mode="super-admin"
          baseUrl="/admin/super-admin/invoices"
        />
      </div>

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
