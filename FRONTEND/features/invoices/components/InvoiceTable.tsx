"use client"

import { cn } from "@/lib/utils"
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
import { Eye } from "lucide-react"
import { StatusBadge } from "@/components/shared/StatusBadge"

export type TableViewMode = "super-admin" | "auditor" | "regulator"

interface InvoiceTableProps {
    invoices: Invoice[]
    mode: TableViewMode
    baseUrl: string // e.g. "/admin/super-admin/invoices"
}

export function InvoiceTable({ invoices, mode, baseUrl }: InvoiceTableProps) {

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[150px] px-2 py-2 text-black font-bold text-base">Invoice No.</TableHead>
                        <TableHead className="px-2 py-2 text-black font-bold text-base">Company</TableHead>
                        <TableHead className="px-2 py-2 text-black font-bold text-base">Date</TableHead>
                        <TableHead className="px-2 py-2 text-black font-bold text-base">Amount</TableHead>
                        <TableHead className="px-2 py-2 text-black font-bold text-base text-center">AI Analysis</TableHead>
                        <TableHead className="px-2 py-2 text-black font-bold text-base text-center">Status</TableHead>
                        <TableHead className="px-2 py-2 text-black font-bold text-base text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((row) => (
                            <TableRow key={row._id} className="h-16 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-2 font-bold text-base text-black">{row.invoiceNo}</TableCell>
                                <TableCell className="px-2 font-bold text-base text-black">{row.companyName}</TableCell>
                                <TableCell className="px-2 font-bold text-base text-black">{new Date(row.invoiceDate).toLocaleDateString()}</TableCell>
                                <TableCell className="px-2 font-bold text-base text-black">${row.totals_total.toLocaleString()}</TableCell>
                                <TableCell className="px-2 text-center">
                                    <StatusBadge verdict={row.ai_verdict} />
                                </TableCell>
                                <TableCell className="px-2 text-center">
                                    <StatusBadge status={row.status} />
                                </TableCell>
                                <TableCell className="px-2 text-center">
                                    <Link href={`${baseUrl}/${row._id}`}>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className={cn(
                                                "gap-2 font-bold h-8 px-6 rounded-md text-xs shadow-none",
                                                (mode === 'auditor' || mode === 'regulator') && "bg-blue-500 hover:bg-blue-600 text-white"
                                            )}
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
        </div>
    )
}
