"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useAuditorFlaggedQueue } from "@/hooks/auditor/flagged/use-auditor-flagged-queue"

export default function AuditorFlaggedPage() {
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
  } = useAuditorFlaggedQueue()

  return (
    <div className="bg-transparent space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Flagged Invoices
        </h1>
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
        mode="auditor"
        baseUrl="/admin/auditor/invoices"
      />

      {/* Pagination Controls */}
      <div className="mt-8 flex items-center justify-center gap-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
