"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useManagerInvoices } from "@/hooks/company-manager/invoices/use-manager-invoices"
import { Pagination } from '@/components/ui/data-display/pagination-custom'
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"

export default function ManagerInvoicesPage() {
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
    requestSort,
    isLoading 
  } = useManagerInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {}
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

      {isLoading ? (
        <InvoiceTableSkeleton />
      ) : (
        <InvoiceTable
          invoices={invoices}
          mode="manager"
          baseUrl="/company/manager/invoices"
        />
      )}

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
