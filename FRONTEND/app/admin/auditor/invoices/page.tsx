"use client"

import { useContext, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"
import { useAuditorInvoices } from "@/hooks/auditor/use-auditor-invoices"
import { DataPagination } from "@/components/common/DataPagination"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { SocketContext } from "@/providers/socket-provider"
import { useSocketEvent } from "@/hooks/global/use-socket-event"
import { SocketEvents } from "@/lib/socket-events"

export default function AuditorInvoicesPage() {
  const queryClient = useQueryClient()
  const socketCtx = useContext(SocketContext)

  // Auto-refresh list when AI finishes or a new invoice arrives
  const invalidateList = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["invoices"] })
  }, [queryClient])

  useSocketEvent(socketCtx!, SocketEvents.INVOICE_AI_COMPLETE, invalidateList)
  useSocketEvent(socketCtx!, SocketEvents.INVOICE_CREATED, invalidateList)
  useSocketEvent(socketCtx!, SocketEvents.INVOICE_LIST_INVALIDATE, invalidateList)

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
  } = useAuditorInvoices()

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
