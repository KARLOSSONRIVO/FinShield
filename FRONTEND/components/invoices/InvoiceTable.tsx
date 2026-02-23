"use client"

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ListInvoice, MyInvoice, PaginationDetails } from "@/lib/types"
import { ChevronUp, ChevronDown } from "lucide-react"
import { DataPagination } from "../common/DataPagination"

export type TableViewMode = "super-admin" | "auditor" | "regulator" | "manager" | "employee"

// The table accepts either ListInvoice (all roles) or MyInvoice (employee)
type AnyInvoice = ListInvoice | MyInvoice

interface InvoiceTableProps {
    invoices: AnyInvoice[]
    mode: TableViewMode
    baseUrl: string
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
}

function getStatusColor(status: string) {
    switch (status) {
        case "verified": return "bg-emerald-600 text-white"
        case "flagged": return "bg-yellow-500 text-black"
        case "fraudulent": return "bg-red-600 text-white"
        case "anchored": return "bg-blue-500 text-white"
        default: return "bg-gray-400 text-white"
    }
}

function getVerdictColor(verdict: string) {
    return verdict === "clean" ? "bg-emerald-600 text-white" : "bg-yellow-500 text-black"
}

const showCompany = (mode: TableViewMode) => mode !== "manager" && mode !== "employee"

export function InvoiceTable({ invoices, mode, baseUrl, pagination, onPageChange, sortBy, order, onSort }: InvoiceTableProps) {
    const isEmployee = mode === "employee"

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="px-4 py-4">
                            <div className="flex items-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("invoiceNumber")}>
                                Invoice No.
                                {sortBy === "invoiceNumber" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        </TableHead>

                        {showCompany(mode) && (
                            <TableHead className="px-4 py-4 font-bold text-base text-foreground">Company</TableHead>
                        )}

                        <TableHead className="px-4 py-4">
                            <div className="flex items-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("invoiceDate")}>
                                {isEmployee ? "Uploaded At" : "Invoice Date"}
                                {sortBy === "invoiceDate" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        </TableHead>

                        {!isEmployee && (
                            <TableHead className="px-4 py-4">
                                <div className="flex items-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("totalAmount")}>
                                    Amount
                                    {sortBy === "totalAmount" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                        )}

                        {!isEmployee && (
                            <TableHead className="px-4 py-4 font-bold text-base text-foreground text-center">AI Verdict</TableHead>
                        )}

                        <TableHead className="px-4 py-4 font-bold text-base text-foreground text-center">Status</TableHead>
                        <TableHead className="px-4 py-4 font-bold text-base text-foreground text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((row) => {
                            const id = row.id || (row as any)._id
                            const listRow = row as ListInvoice
                            const myRow = row as MyInvoice

                            return (
                                <TableRow key={id} className="h-16 hover:bg-muted/30 transition-colors border-b border-border/50">
                                    <TableCell className="px-4 font-bold text-base text-foreground">
                                        {row.invoiceNumber || "—"}
                                    </TableCell>

                                    {showCompany(mode) && (
                                        <TableCell className="px-4 font-bold text-base text-foreground">
                                            {listRow.companyName || "—"}
                                        </TableCell>
                                    )}

                                    <TableCell className="px-4 text-foreground">
                                        {isEmployee
                                            ? (myRow.uploadedAt ? new Date(myRow.uploadedAt).toLocaleDateString() : "—")
                                            : (listRow.date ? new Date(listRow.date).toLocaleDateString() : "—")
                                        }
                                    </TableCell>

                                    {
                                        !isEmployee && (
                                            <TableCell className="px-4 font-bold text-base text-foreground">
                                                {listRow.amount != null ? `$${listRow.amount.toLocaleString()}` : "—"}
                                            </TableCell>
                                        )
                                    }

                                    {
                                        !isEmployee && (
                                            <TableCell className="px-4 text-center">
                                                {listRow.aiVerdict ? (
                                                    <Badge className={`${getVerdictColor(listRow.aiVerdict.verdict)} rounded-md px-3 capitalize text-[10px] font-bold`}>
                                                        {listRow.aiVerdict.verdict}
                                                    </Badge>
                                                ) : "—"}
                                            </TableCell>
                                        )
                                    }

                                    <TableCell className="px-4 text-center">
                                        <Badge className={`${getStatusColor(row.status)} rounded-md px-3 capitalize text-[10px] font-bold`}>
                                            {row.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="px-4 text-center">
                                        <Link href={`${baseUrl}/${id}`}>
                                            <Button size="sm" className="font-bold h-8 px-6 rounded-md text-xs shadow-none bg-blue-500 hover:bg-blue-600 text-white">
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
            {
                pagination && onPageChange && (
                    <div className="px-3">
                        <DataPagination pagination={pagination} onPageChange={onPageChange} />
                    </div>
                )
            }
        </div >
    )
}
