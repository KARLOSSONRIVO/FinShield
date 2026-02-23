"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { LedgerInvoice } from "@/lib/types"
import { ChevronUp, ChevronDown } from "lucide-react"

interface BlockchainTableProps {
    invoices: LedgerInvoice[]
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
}

export function BlockchainTable({ invoices, sortBy, order, onSort }: BlockchainTableProps) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm px-3 py-2 overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base">Invoice No.</TableHead>
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base">Company</TableHead>
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base">Transaction Hash</TableHead>
                        <TableHead className="px-6 py-4">
                            <div
                                className="flex items-center justify-start gap-2 cursor-pointer font-bold text-base text-foreground"
                                onClick={() => onSort?.("anchoredAt")}
                            >
                                Anchored At
                                {sortBy === 'anchoredAt' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        </TableHead>
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No anchored invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((row) => (
                            <TableRow key={row.id || (row as any)._id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-6 font-bold text-base text-foreground">
                                    {row.invoiceNumber || '—'}
                                </TableCell>
                                <TableCell className="px-6 font-bold text-base text-foreground">
                                    {row.company || '—'}
                                </TableCell>
                                <TableCell className="px-6 font-mono text-sm text-muted-foreground max-w-[220px] truncate">
                                    {row.transactionHash || "—"}
                                </TableCell>
                                <TableCell className="px-6 font-bold text-base text-foreground">
                                    {row.anchoredAt ? new Date(row.anchoredAt).toLocaleString() : "—"}
                                </TableCell>
                                <TableCell className="px-6 text-center">
                                    <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-md text-[10px] font-bold inline-block min-w-[80px] uppercase tracking-wider">
                                        {row.status || "Anchored"}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
