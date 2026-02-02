"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useFlaggedQueue } from "@/hooks/super-admin/flagged/use-flagged-queue"
import { Pagination } from "@/components/ui/pagination-custom"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"

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
    sortConfig,
    requestSort
  } = useFlaggedQueue()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Flagged Invoices</h2>
      </div>

      <div>
        <InvoiceFilter
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sortConfig={sortConfig}
          onSortChange={requestSort}
        />
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
