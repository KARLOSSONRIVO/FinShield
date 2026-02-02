"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useSuperAdminInvoices } from "@/hooks/invoices/use-super-admin-invoices"
import { Pagination } from "@/components/ui/pagination-custom"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"

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
  } = useSuperAdminInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Invoice Management</h2>
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
        mode="super-admin"
        baseUrl="/admin/super-admin/invoices"
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
