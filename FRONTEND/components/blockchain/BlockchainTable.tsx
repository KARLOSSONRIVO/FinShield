"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Invoice } from "@/lib/types"

interface BlockchainTableProps {
    invoices: Invoice[]
}

export function BlockchainTable({ invoices }: BlockchainTableProps) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm px-3 py-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="px-6 py-4 text-black font-bold text-base">Invoice No.</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base">Company</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base">Transaction Hash</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base">Anchored At</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base text-center">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No verified invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((row) => (
                            <TableRow key={row._id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-6 font-bold text-base text-black">{row.invoiceNo}</TableCell>
                                <TableCell className="px-6 font-bold text-base text-black">{row.companyName}</TableCell>
                                <TableCell className="px-6 font-mono text-sm text-gray-600 max-w-[200px] truncate">
                                    {row.blockchain_txHash || "-"}
                                </TableCell>
                                <TableCell className="px-6 font-bold text-base text-black">
                                    {row.blockchain_anchoredAt ? new Date(row.blockchain_anchoredAt).toLocaleString() : "-"}
                                </TableCell>
                                <TableCell className="px-6 text-center">
                                    <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-md text-[10px] font-bold inline-block min-w-[80px] uppercase tracking-wider">
                                        Verified
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
