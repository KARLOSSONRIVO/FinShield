"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { PendingInvoiceFilter } from "@/components/invoices/PendingInvoiceFilter"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { usePendingQueue } from "@/hooks/auditor/use-pending-queue"

export default function AuditorPendingPage() {
    const {
        invoices,
        pagination,
        setPage,
        search,
        setSearch,
        sortConfig,
        requestSort,
        dateRange,
        setDateRange,
        isLoading,
        resetFilters,
        monthFilter,
        setMonthFilter,
        yearFilter,
        setYearFilter,
        availableYears,
    } = usePendingQueue()

    return (
        <div className="space-y-3">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Pending Invoices</h1>
                <PendingInvoiceFilter
                    search={search || ""}
                    onSearchChange={setSearch}
                    sortConfig={sortConfig}
                    onSortChange={requestSort}
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
                    order={sortConfig?.direction}
                    onSort={requestSort}
                />
            )}

            {/* Pagination Controls */}
            {pagination?.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${pagination.page === p
                                ? "bg-emerald-100 text-emerald-700"
                                : "text-gray-600 hover:bg-gray-100"
                                }`}
                            aria-label={`Go to page ${p}`}
                            aria-current={pagination.page === p ? "page" : undefined}
                        >
                            {p}
                        </button>
                    ))}

                    <button
                        onClick={() => setPage(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    )
}