"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"
import { MOCK_AUDITOR_INVOICES } from "@/hooks/mock-data"
import { useAuditorInvoices } from "@/hooks/invoices/use-auditor-invoices"
import type { Invoice } from '@/types'


const mappedInvoices = MOCK_AUDITOR_INVOICES.map((inv: any) => ({
  ...inv,
  companyOrgId: "mock-org",
  uploadedByUserId: "mock-user",
  invoiceDate: new Date(inv.date || new Date()),
  createdAt: new Date(),
  updatedAt: new Date(),
  ai_verdict: (['clean', 'flagged'].includes(inv.ai_verdict) ? inv.ai_verdict : 'flagged') as "clean" | "flagged",
})) as Invoice[]

export default function AuditorInvoicesPage() {
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
  } = useAuditorInvoices(mappedInvoices)

  return (
    <div className="bg-transparent space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Invoice Management</h1>
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
          mode="auditor"
          baseUrl="/admin/auditor/invoices"
        />
      )}

      {}
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
