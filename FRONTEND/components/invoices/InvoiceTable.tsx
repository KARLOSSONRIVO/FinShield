"use client"

import { cn } from "@/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/data-display/table'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Invoice } from '@/types'
import { Eye } from "lucide-react"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/common/StatusBadge"

export type TableViewMode = "super-admin" | "auditor" | "regulator" | "manager" | "employee"

interface InvoiceTableProps {
    invoices: Invoice[]
    mode: TableViewMode
    baseUrl: string 
}

export function InvoiceTable({ invoices, mode, baseUrl }: InvoiceTableProps) {

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm px-3 py-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[150px] px-2 py-2 text-black font-bold text-base">Invoice No.</TableHead>
                        {mode !== 'manager' && mode !== 'employee' && (
                            <TableHead className="px-2 py-2 text-black font-bold text-base">Company</TableHead>
                        )}
                        {(mode === 'manager' || mode === 'employee') && (
                            <TableHead className="px-2 py-2 text-black font-bold text-base">Blockchain</TableHead>
                        )}
                        {mode === 'manager' && (
                            <TableHead className="px-2 py-2 text-black font-bold text-base">Uploaded By</TableHead>
                        )}
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
                            <TableCell colSpan={mode === 'manager' ? 8 : 7} className="h-24 text-center text-muted-foreground">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((row) => (
                            <TableRow key={row._id} className="h-16 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-2 font-bold text-base text-black">{row.invoiceNo}</TableCell>
                                {mode !== 'manager' && mode !== 'employee' && (
                                    <TableCell className="px-2 font-bold text-base text-black">{row.companyName}</TableCell>
                                )}
                                {(mode === 'manager' || mode === 'employee') && (
                                    <TableCell className="px-2 font-medium text-sm text-black font-mono">
                                        {row.blockchain_txHash ? `${row.blockchain_txHash.substring(0, 10)}...` : '-'}
                                    </TableCell>
                                )}
                                {mode === 'manager' && (
                                    <TableCell className="px-2 font-bold text-base text-black">{row.uploadedByName || 'Unknown'}</TableCell>
                                )}
                                <TableCell className="px-2 font-bold text-base text-black">{row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : 'N/A'}</TableCell>
                                <TableCell className="px-2 font-bold text-base text-black">${row.totals_total?.toLocaleString() ?? '0.00'}</TableCell>
                                <TableCell className="px-2 text-center">
                                    {row.ai_verdict && <AIVerdictBadge verdict={row.ai_verdict} hideScore={true} />}
                                </TableCell>
                                <TableCell className="px-2 text-center">
                                    <InvoiceStatusBadge status={row.status} />
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
        </div>
    )
}
