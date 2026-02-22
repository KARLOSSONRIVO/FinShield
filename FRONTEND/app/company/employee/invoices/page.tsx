"use client"

import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InvoiceFilter } from "@/components/invoices/InvoiceFilter"
import { InvoiceStatusFilter, SortConfig } from "@/hooks/invoices/use-auditor-invoices"
import { Invoice } from "@/lib/types"
import { useState } from "react"
import { Pagination } from "@/components/ui/pagination-custom"
import { InvoiceTable } from "@/components/invoices/InvoiceTable"

export default function EmployeeInvoicesPage() {
  // Filter invoices for this specific employee
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>("all")
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "invoiceDate", direction: "desc" })
  const [currentPage, setCurrentPage] = useState(1)

  const rawInvoices: Invoice[] = []
    .filter((i: Invoice) => i.uploadedByUserId === "user-employee-1")

  // Filter logic
  const filteredInvoices = rawInvoices.filter((invoice: Invoice) => {
    const matchesSearch =
      (invoice.invoiceNo || "").toLowerCase().includes(search.toLowerCase()) ||
      (invoice.companyName && invoice.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (invoice.totals_total || 0).toString().includes(search)

    const matchesStatus = (() => {
      if (statusFilter === "all") return true
      if (statusFilter === "flagged") return invoice.status === "flagged" || invoice.ai_verdict === "flagged"
      return invoice.status === statusFilter
    })()

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredInvoices.length / 10)
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * 10, currentPage * 10)

  // Sort handler
  const requestSort = (key: keyof Invoice) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Invoice Management</h2>
      </div>

      <InvoiceFilter
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => setStatusFilter(val as InvoiceStatusFilter)}
        sortConfig={sortConfig}
        onSortChange={(key) => requestSort(key as keyof Invoice)}
      />

      <div className="rounded-xl border border-border bg-card shadow-sm px-3 py-2">
        <InvoiceTable
          invoices={paginatedInvoices}
          mode="employee"
          baseUrl="/company/employee/invoices"
          sortBy={sortConfig?.key}
          order={sortConfig?.direction as "asc" | "desc" | undefined}
          onSort={(field) => requestSort(field as any)}
        />
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
