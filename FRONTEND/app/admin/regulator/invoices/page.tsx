"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useRegulatorInvoices } from "@/hooks/invoices/use-regulator-invoices"
import { DataPagination } from "@/components/common/DataPagination"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"

export default function RegulatorInvoicesPage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    invoices,
    pagination,
    setPage,
    sortConfig,
    requestSort
  } = useRegulatorInvoices()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Invoice Oversight</h2>
      </div>

      <InvoiceFilter
        search={search || ""}
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
        sortBy={sortConfig?.key}
        order={sortConfig?.direction as "asc" | "desc" | undefined}
        onSort={(field) => requestSort(field as any)}
      />

      <div className="mt-4 flex justify-center">
        <DataPagination
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
