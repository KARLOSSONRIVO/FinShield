"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useEmployeeFlaggedQueue } from "@/hooks/flagged/use-employee-flagged"
import { InvoiceTableSkeleton } from "@/components/skeletons/invoice-table-skeleton"

export default function EmployeeFlaggedPage() {
    const {
        search,
        setSearch,
        invoices,
        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort,
        isLoading
    } = useEmployeeFlaggedQueue()

    // Handle search change
    const handleSearchChange = (value: string) => {
        setSearch(value || "")
    }

    return (
        <div className="bg-transparent space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Flagged Invoices Queue
                </h1>
            </div>

            <InvoiceFilter
                search={search || ""}
                onSearchChange={handleSearchChange}
                sortConfig={sortConfig}
                onSortChange={requestSort}
            />

            {isLoading ? (
                <InvoiceTableSkeleton />
            ) : (
                <>
                    <InvoiceTable
                        invoices={invoices}
                        mode="employee"
                        baseUrl="/company/employee/invoices"
                        sortBy={sortConfig?.key}
                        order={sortConfig?.direction}
                        onSort={requestSort}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous page"
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
                                    aria-label={`Go to page ${page}`}
                                    aria-current={currentPage === page ? "page" : undefined}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next page"
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