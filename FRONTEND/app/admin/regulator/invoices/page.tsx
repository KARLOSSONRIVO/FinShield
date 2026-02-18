"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useRegulatorInvoices } from "@/hooks/invoices/use-regulator-invoices"
import { Pagination } from '@/components/ui/data-display/pagination-custom'
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"

export default function RegulatorInvoicesPage() {
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
  } = useRegulatorInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Invoice Oversight</h2>
      </div>

      <InvoiceFilter
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        sortConfig={sortConfig}
        onSortChange={requestSort}
      />

      <InvoiceTable
        invoices={invoices}
        mode="regulator"
        baseUrl="/admin/regulator/invoices"
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
