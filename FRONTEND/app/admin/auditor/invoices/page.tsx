"use client"

import { useContext, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"
import { useAuditorInvoices } from "@/hooks/invoices/use-auditor-invoices"
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
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    invoices,
    pagination,
    setPage,
    sortConfig,
    requestSort,
    isLoading
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
