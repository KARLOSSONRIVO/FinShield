"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"
import type { Invoice } from "@/lib/types"

interface InvoicesTableProps {
    invoices: Invoice[]
    linkPrefix: string
    showUploadedBy?: boolean
}

export function EmployeeInvoicesTable({ invoices, linkPrefix, showUploadedBy = false }: InvoicesTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    {showUploadedBy && <TableHead>Uploaded By</TableHead>}
                    <TableHead>AI Verdict</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blockchain</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                        <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                        <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                        <TableCell>${invoice.totals_total.toLocaleString()}</TableCell>
                        {showUploadedBy && <TableCell>{invoice.uploadedByName}</TableCell>}
                        <TableCell>
                            <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                        </TableCell>
                        <TableCell>
                            <InvoiceStatusBadge status={invoice.status} />
                        </TableCell>
                        <TableCell>
                            {invoice.blockchain_txHash ? (
                                <span className="text-xs font-mono text-primary">
                                    {invoice.blockchain_txHash.slice(0, 10)}...
                                </span>
                            ) : (
                                <span className="text-xs text-muted-foreground">Pending</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                            <Link href={`${linkPrefix}/${invoice._id}`}>
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
