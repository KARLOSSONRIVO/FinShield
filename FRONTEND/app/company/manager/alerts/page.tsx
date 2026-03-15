"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { FlaggedInvoiceFilter } from "@/components/invoices/FlaggedInvoiceFilter"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useFlaggedQueue } from "@/hooks/super-admin/use-flagged-queue"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"

export default function ManagerFlaggedPage() {
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
    isLoading,
    dateRange,
    setDateRange,
    hasActiveFilters,
    resetFilters,
  } = useFlaggedQueue()

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Flagged Invoices Queue</h1>
        <FlaggedInvoiceFilter
          search={search || ""}
          onSearchChange={setSearch}
          sortConfig={sortConfig as any}
          onSortChange={requestSort}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter as any}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={resetFilters}
        />
      </div>

      {isLoading ? (
        <InvoiceTableSkeleton />
      ) : (
        <>
          <InvoiceTable
            invoices={invoices as any[]}
            mode="manager"
            baseUrl="/company/manager/invoices"
            sortBy={sortConfig?.key as any}
            order={sortConfig?.direction}
            onSort={requestSort}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${currentPage === page
                    ? "bg-emerald-100 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
