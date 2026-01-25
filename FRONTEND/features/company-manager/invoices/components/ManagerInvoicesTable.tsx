"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Eye, Clock, CheckCircle, AlertTriangle, XCircle, User } from "lucide-react"

interface Invoice {
    id: string
    invoiceNo: string
    vendor: string
    amount: number
    status: "pending" | "verified" | "flagged" | "fraudulent"
    date: string
    uploadedBy?: string
}

interface ManagerInvoicesTableProps {
    invoices: Invoice[]
    linkPrefix: string
    showUploadedBy?: boolean
}

export function ManagerInvoicesTable({ invoices, linkPrefix, showUploadedBy = false }: ManagerInvoicesTableProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "verified":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>
            case "flagged":
                return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" /> Flagged</Badge>
            case "fraudulent":
                return <Badge variant="destructive" className="bg-red-700 hover:bg-red-800"><XCircle className="w-3 h-3 mr-1" /> Fraud</Badge>
            default:
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        {showUploadedBy && <TableHead>Uploaded By</TableHead>}
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={showUploadedBy ? 7 : 6} className="h-24 text-center">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                                <TableCell>{invoice.vendor}</TableCell>
                                <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                                <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                                {showUploadedBy && (
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{invoice.uploadedBy || "Unknown"}</span>
                                        </div>
                                    </TableCell>
                                )}
                                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`${linkPrefix}/${invoice.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4 mr-1" />
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
