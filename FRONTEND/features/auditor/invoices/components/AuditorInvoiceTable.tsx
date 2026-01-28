"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface AuditorInvoiceTableProps {
    invoices: any[]
}

export function AuditorInvoiceTable({ invoices }: AuditorInvoiceTableProps) {
    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="py-5 font-bold text-black pl-6">Invoice No.</TableHead>
                        <TableHead className="py-5 font-bold text-black">Company</TableHead>
                        <TableHead className="py-5 font-bold text-black">Date</TableHead>
                        <TableHead className="py-5 font-bold text-black">Amount</TableHead>
                        <TableHead className="py-5 font-bold text-black">AI Analysis</TableHead>
                        <TableHead className="px-7 font-bold text-black">Status</TableHead>
                        <TableHead className="px-5 font-bold text-black">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.map((invoice) => (
                        <TableRow key={invoice._id} className="hover:bg-gray-50/50">
                            <TableCell className="font-bold px-6 pl-6">{invoice.invoiceNo}</TableCell>
                            <TableCell className="font-bold py-6">{invoice.companyName}</TableCell>
                            <TableCell className="font-bold py-6">{invoice.date}</TableCell>
                            <TableCell className="font-bold py-6">${invoice.totals_total.toLocaleString()}</TableCell>
                            <TableCell className="py-6">
                                <VerdictBadge verdict={invoice.ai_verdict} />
                            </TableCell>
                            <TableCell className="py-6">
                                <StatusBadge status={invoice.status} />
                            </TableCell>
                            <TableCell className="py-6">
                                <Link href={`/admin/auditor/invoices/${invoice._id}`}>
                                    <Button className="bg-blue-500 hover:bg-blue-600 text-white w-20 h-9 text-xs font-semibold rounded-md shadow-sm">
                                        View
                                    </Button>
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function VerdictBadge({ verdict }: { verdict: string }) {
    const v = verdict.toLowerCase();

    // Using inline styles or standard tailwind classes that closely approximate the screenshot
    if (v === "clean") {
        return <div className="inline-flex items-center justify-center rounded-md bg-[#00A86B] px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider w-24">CLEAN</div>
    }
    if (v === "flagged") {
        return <div className="inline-flex items-center justify-center rounded-md bg-[#FFA500] px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider w-24">FLAGGED</div>
    }
    if (v === "fraudulent") {
        return <div className="inline-flex items-center justify-center rounded-md bg-[#DC2626] px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider w-24">FRAUDULENT</div>
    }
    return <Badge variant="outline">{verdict}</Badge>
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();

    if (s === "verified") {
        return <div className="inline-flex items-center justify-center rounded-md bg-[#00A86B] px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider w-24">VERIFIED</div>
    }
    if (s === "pending") {
        return <div className="inline-flex items-center justify-center rounded-md bg-[#546e7a] px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider w-24">PENDING</div>
    }
    if (s === "fraud" || s === "fraudulent") {
        return <div className="inline-flex items-center justify-center rounded-md bg-[#DC2626] px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider w-24">FRAUDULENT</div>
    }
    if (s === "flagged") {
        return <div className="inline-flex items-center justify-center rounded-md bg-[#FFA500] px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider w-24">FLAGGED</div>
    }
    return <Badge variant="outline">{status}</Badge>
}
