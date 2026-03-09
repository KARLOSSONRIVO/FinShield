// app/company/employee/invoices/page.tsx
"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useEmployeeInvoices } from "@/hooks/company-employee/invoices/use-employee-invoices"
import { DataPagination } from "@/components/common/DataPagination"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"

// Make sure it's a function component with proper export
export default function EmployeeInvoicesPage() {
  const {
    search, setSearch,
    invoices, pagination, setPage,
    sortConfig, requestSort,
    isLoading
  } = useEmployeeInvoices()

  console.log('EmployeeInvoicesPage rendering', { invoices }); // Debug log

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">My Invoices</h2>
      </div>

      <InvoiceFilter
        search={search || ""}
        onSearchChange={setSearch}
        sortConfig={sortConfig}
        onSortChange={requestSort}
      />

      {isLoading ? (
        <InvoiceTableSkeleton />
      ) : (
        <InvoiceTable
          invoices={invoices || []}
          mode="employee"
          baseUrl="/company/employee/invoices"
          sortBy={sortConfig?.key}
          order={sortConfig?.direction as "asc" | "desc" | undefined}
          onSort={(field) => requestSort(field as any)}
        />
      )}

      <div className="mt-4 flex justify-center">
        <DataPagination
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}