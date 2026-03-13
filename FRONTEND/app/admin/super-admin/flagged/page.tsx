"use client"

import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { FlaggedTableSkeleton } from "@/components/skeletons/flagged-table-skeleton"
import { useFlaggedQueue } from "@/hooks/flagged/use-flagged-queue"
import { Pagination } from "@/components/ui/pagination-custom"
import { FlaggedInvoiceFilter } from "@/components/invoices/FlaggedInvoiceFilter"
import { useSocketEvent } from "@/hooks/global/use-socket-event"
import { SocketEvents } from "@/lib/socket-events"
import { SocketContext } from "@/providers/socket-provider"
import { useContext } from "react"
import { useQueryClient } from "@tanstack/react-query"

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
    requestSort,
    isLoading,
    dateRange,
    setDateRange,
    hasActiveFilters,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    availableYears,
    resetFilters,
  } = useFlaggedQueue()

  const queryClient = useQueryClient()
  const socketCtx = useContext(SocketContext)

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: ["flagged-queue"] })
  }

  useSocketEvent(socketCtx!, SocketEvents.INVOICE_LIST_INVALIDATE, invalidateList)

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Flagged Invoices</h1>
        <FlaggedInvoiceFilter
          search={search || ""}
          onSearchChange={setSearch}
          sortConfig={sortConfig}
          onSortChange={requestSort}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter as any}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          hasActiveFilters={hasActiveFilters}
          monthFilter={monthFilter}
          yearFilter={yearFilter}
          onMonthChange={setMonthFilter}
          onYearChange={setYearFilter}
          availableYears={availableYears}
          onClearFilters={resetFilters}
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <FlaggedTableSkeleton />
        ) : (
          <InvoiceTable
            invoices={invoices}
            mode="super-admin"
            baseUrl="/admin/super-admin/invoices"
          />
        )}
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
