"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import type { Invoice } from "@/lib/types"

interface RegulatorBlockchainTableProps {
    invoices: Invoice[]
}

export function RegulatorBlockchainTable({ invoices }: RegulatorBlockchainTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead>Anchored At</TableHead>
                    <TableHead>Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                        <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                        <TableCell>{invoice.companyName}</TableCell>
                        <TableCell>${invoice.totals_total.toLocaleString()}</TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate">{invoice.blockchain_txHash}</TableCell>
                        <TableCell>
                            {invoice.blockchain_anchoredAt ? new Date(invoice.blockchain_anchoredAt).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                            <Badge variant="default" className="bg-primary text-primary-foreground">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                            </Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
