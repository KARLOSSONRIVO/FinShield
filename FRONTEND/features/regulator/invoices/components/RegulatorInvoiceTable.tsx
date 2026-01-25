"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"
import { Eye } from "lucide-react"
import Link from "next/link"
import type { Invoice } from "@/lib/types"

interface RegulatorInvoiceTableProps {
    invoices: Invoice[]
}

export function RegulatorInvoiceTable({ invoices }: RegulatorInvoiceTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>AI Analysis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                        <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                        <TableCell>{invoice.companyName}</TableCell>
                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                        <TableCell>${invoice.totals_total.toLocaleString()}</TableCell>
                        <TableCell>
                            <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                        </TableCell>
                        <TableCell>
                            <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>
                            <Link href={`/admin/regulator/invoices/${invoice._id}`}>
                                <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                </Button>
                            </Link>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
