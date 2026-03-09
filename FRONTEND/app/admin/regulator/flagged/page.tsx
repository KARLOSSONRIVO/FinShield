"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"
import { useRegulatorFlaggedInvoices } from "@/hooks/invoices/use-regulator-flagged"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"

export default function RegulatorFlaggedInvoicesPage() {
    const {
        search,
        setSearch,
        requestSort,
        sortConfig,
        invoices,
        currentPage,
        totalPages,
        setCurrentPage,
    } = useRegulatorFlaggedInvoices()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-normal tracking-tight">Flagged Invoices Oversight</h2>
            </div>

            <InvoiceFilter
                search={search || ""}
                onSearchChange={setSearch}
                sortConfig={sortConfig as any}
                onSortChange={requestSort}
            />

            <InvoiceTable
                invoices={invoices}
                mode="regulator"
                baseUrl="/admin/regulator/invoices"
                sortBy={sortConfig?.key}
                order={sortConfig?.direction as "asc" | "desc" | undefined}
                onSort={(field) => requestSort(field as any)}
            />

            {/* Pagination Controls */}
            <div className="mt-8 flex items-center justify-center gap-2">
                <button
                    onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
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
                    onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
