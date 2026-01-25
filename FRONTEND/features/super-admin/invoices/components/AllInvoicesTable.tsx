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
import { SortConfig } from "../hooks/useInvoices"
import { ArrowUpDown } from "lucide-react"

interface AllInvoicesTableProps {
    invoices: Invoice[]
    sortConfig: SortConfig
    onSort: (key: keyof Invoice) => void
}

export function AllInvoicesTable({ invoices, sortConfig, onSort }: AllInvoicesTableProps) {
    const getAiBadgeColor = (verdict: string) => {
        switch (verdict) {
            case "clean": return "bg-emerald-600";
            case "flagged": return "bg-yellow-500 text-black";
            default: return "bg-gray-500";
        }
    }

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "verified": return "bg-emerald-600";
            case "pending": return "bg-slate-500";
            case "fraudulent": return "bg-red-600";
            case "flagged": return "bg-yellow-500 text-black";
            default: return "bg-gray-500";
        }
    }

    const getSortIcon = (key: keyof Invoice) => {
        if (sortConfig?.key === key) {
            return <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.direction === "asc" ? "text-primary" : "text-primary/70"}`} />
        }
        return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[150px] px-6 py-4 text-black font-bold text-base">Invoice No.</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base">Company</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base">Date</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base">Amount</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base text-center">AI Analysis</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base text-center">Status</TableHead>
                        <TableHead className="px-6 py-4 text-black font-bold text-base text-center">Action</TableHead>
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
                            <TableRow key={row._id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-6 font-bold text-base text-black">{row.invoiceNo}</TableCell>
                                <TableCell className="px-6 font-bold text-base text-black">{row.companyName}</TableCell>
                                <TableCell className="px-6 font-bold text-base text-black">{new Date(row.invoiceDate).toLocaleDateString()}</TableCell>
                                <TableCell className="px-6 font-bold text-base text-black">${row.totals_total.toLocaleString()}</TableCell>
                                <TableCell className="px-6 text-center">
                                    <div className={`${getAiBadgeColor(row.ai_verdict)} text-white px-4 py-1.5 rounded-md text-[10px] font-bold inline-block min-w-[80px] uppercase tracking-wider`}>
                                        {row.ai_verdict}
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-center">
                                    <div className={`${getStatusBadgeColor(row.status)} text-white px-4 py-1.5 rounded-md text-[10px] font-bold inline-block min-w-[80px] uppercase tracking-wider`}>
                                        {row.status}
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-center">
                                    <Link href={`/admin/super-admin/invoices/${row._id}`}>
                                        <Button size="sm" className="bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white font-bold h-8 px-6 rounded-md text-xs shadow-none">View</Button>
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
