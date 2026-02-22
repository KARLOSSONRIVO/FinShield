"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Invoice } from "@/lib/types"
import { ArrowUpDown } from "lucide-react"
import { InvoiceStatusBadge } from "@/components/common/StatusBadge"
import { PaginationDetails } from "@/lib/types"
import { DataPagination } from "../common/DataPagination"

export type TableViewMode = "super-admin" | "auditor" | "regulator" | "manager" | "employee"

interface InvoiceTableProps {
    invoices: Invoice[]
    mode: TableViewMode
    baseUrl: string
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
}

export function InvoiceTable({ invoices, mode, baseUrl, pagination, onPageChange, sortBy, order, onSort }: InvoiceTableProps) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm px-3 py-2 overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[150px] px-2 py-2 text-foreground font-bold text-base">Invoice No.</TableHead>
                        {mode !== 'manager' && mode !== 'employee' && (
                            <TableHead className="px-2 py-2 text-foreground font-bold text-base">Company</TableHead>
                        )}
                        <TableHead className="px-2 py-2 text-foreground font-bold text-base">Transaction Hash</TableHead>
                        <TableHead className="px-2 py-2">
                            <div
                                className="flex items-center justify-start gap-2 cursor-pointer font-bold text-base text-foreground"
                                onClick={() => onSort?.("anchoredAt")}
                            >
                                Anchored At
                                <ArrowUpDown className={`h-4 w-4 ${sortBy === 'anchoredAt' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                        </TableHead>
                        <TableHead className="px-2 py-2 text-foreground font-bold text-base text-center">Status</TableHead>
                        <TableHead className="px-2 py-2 text-foreground font-bold text-base text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={mode === 'manager' || mode === 'employee' ? 5 : 6} className="h-24 text-center text-muted-foreground">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((row) => (
                            <TableRow key={row._id} className="h-16 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-2 font-bold text-base text-foreground">{row.invoiceNo || '—'}</TableCell>
                                {mode !== 'manager' && mode !== 'employee' && (
                                    <TableCell className="px-2 font-bold text-base text-foreground">{row.companyName || '—'}</TableCell>
                                )}
                                <TableCell className="px-2 font-mono text-sm text-muted-foreground max-w-[200px] truncate">
                                    {row.txHash ? `${row.txHash.substring(0, 16)}…` : '—'}
                                </TableCell>
                                <TableCell className="px-2 font-bold text-base text-foreground">
                                    {row.anchoredAt ? new Date(row.anchoredAt).toLocaleString() : '—'}
                                </TableCell>
                                <TableCell className="px-2 text-center">
                                    <InvoiceStatusBadge status={row.status as any} />
                                </TableCell>
                                <TableCell className="px-2 text-center">
                                    <Link href={`${baseUrl}/${row._id}`}>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="gap-2 font-bold h-8 px-6 rounded-md text-xs shadow-none bg-blue-500 hover:bg-blue-600 text-white"
                                        >
                                            View
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {pagination && onPageChange && (
                <div className="px-3">
                    <DataPagination pagination={pagination} onPageChange={onPageChange} />
                </div>
            )}
        </div>
    )
}
