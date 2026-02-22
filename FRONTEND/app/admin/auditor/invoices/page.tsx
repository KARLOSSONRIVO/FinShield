"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"
import { useAuditorInvoices } from "@/hooks/invoices/use-auditor-invoices"
import { DataPagination } from "@/components/common/DataPagination"
import type { Invoice } from "@/lib/types"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"

export default function AuditorInvoicesPage() {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    invoices,
    pagination,
    setPage,
    sortConfig,
    requestSort,
    isLoading // Destructure isLoading
  } = useAuditorInvoices()

  return (
    <div className="bg-transparent space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
      </div>
      <InvoiceFilter
        search={search || ""}
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
          mode="auditor"
          baseUrl="/admin/auditor/invoices"
          sortBy={sortConfig?.key}
          order={sortConfig?.direction as "asc" | "desc" | undefined}
          onSort={(field) => requestSort(field as any)}
        />
      )}

      <DataPagination
        pagination={pagination}
        onPageChange={setPage}
      />
    </div>
  )
}
