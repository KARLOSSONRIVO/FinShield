"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useManagerInvoices } from "@/hooks/company-manager/invoices/use-manager-invoices"
import { DataPagination } from "@/components/common/DataPagination"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"

export default function ManagerInvoicesPage() {
  const {
    invoices,
    pagination,
    isLoading,
    search,
    setSearch,
    setPage,
    sortConfig,
    requestSort,
    statusFilter,
    setStatusFilter,
    aiVerdictFilter,
    setAiVerdictFilter,
    dateRange,
    setDateRange,
    resetFilters,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    availableYears,
  } = useManagerInvoices()

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Invoices Management</h1>
        <InvoiceFilter
          search={search || ""}
          onSearchChange={setSearch}
          sortConfig={sortConfig}
          onSortChange={requestSort}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter as any}
          aiVerdictFilter={aiVerdictFilter as any}
          onAiVerdictChange={setAiVerdictFilter as any}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onClearFilters={resetFilters}
          monthFilter={monthFilter}
          yearFilter={yearFilter}
          onMonthChange={setMonthFilter}
          onYearChange={setYearFilter}
          availableYears={availableYears}
        />
      </div>

      {isLoading ? (
        <InvoiceTableSkeleton />
      ) : (
        <InvoiceTable
          invoices={invoices}
          mode="manager"
          baseUrl="/company/manager/invoices"
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
