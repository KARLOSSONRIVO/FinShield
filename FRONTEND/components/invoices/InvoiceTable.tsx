"use client"

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ListInvoice, MyInvoice, PaginationDetails } from "@/lib/types"
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react"
import { DataPagination } from "../common/DataPagination"

export type TableViewMode = "super-admin" | "auditor" | "regulator" | "manager" | "employee"

// Extended types to include all possible fields
interface ExtendedListInvoice extends ListInvoice {
    organizationId?: string;
    organizationName?: string;
    companyName?: string;
}

interface ExtendedMyInvoice extends MyInvoice {
    organizationId?: string;
    organizationName?: string;
    companyName?: string;
    // Add missing fields that might be needed
    invoiceDate?: string;
    totalAmount?: number;
}

type AnyInvoice = ExtendedListInvoice | ExtendedMyInvoice

interface InvoiceTableProps {
    invoices: AnyInvoice[]
    mode: TableViewMode
    baseUrl: string
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
}

function getStatusColor(status: string) {
    switch (status?.toLowerCase()) {
        case "approved": return "bg-emerald-600 text-white"
        case "clean": return "bg-emerald-600 text-white"
        case "rejected": return "bg-red-600 text-white"
        case "flagged": return "bg-red-600 text-white"
        case "anchored": return "bg-blue-500 text-white"
        case "pending": return "bg-gray-400 text-white"
        default: return "bg-gray-400 text-white"
    }
}

function getVerdictColor(verdict: string) {
    switch (verdict?.toLowerCase()) {
        case "clean": return "bg-emerald-600 text-white"
        case "flagged": return "bg-yellow-500 text-white"
        default: return "bg-gray-400 text-white"
    }
}

const showCompany = (mode: TableViewMode) => mode !== "manager" && mode !== "employee"

export function InvoiceTable({ invoices, mode, baseUrl, pagination, onPageChange, sortBy, order, onSort }: InvoiceTableProps) {
    const isEmployee = mode === "employee"
    const showOrgColumn = mode === "super-admin" || mode === "regulator"

    // Function to get the best available organization/company name
    const getOrganizationName = (row: AnyInvoice): string => {
        const listRow = row as ExtendedListInvoice;
        const myRow = row as ExtendedMyInvoice;

        return listRow.organizationName ||
            listRow.companyName ||
            myRow.organizationName ||
            myRow.companyName ||
            "—";
    }

    // Helper to get amount safely
    const getAmount = (row: AnyInvoice): number | null => {
        const listRow = row as ExtendedListInvoice;
        const myRow = row as ExtendedMyInvoice;
        return listRow.amount ?? myRow.totalAmount ?? myRow.amount ?? null;
    }

    // Helper to get AI verdict safely - only for non-employee
    const getAiVerdict = (row: AnyInvoice) => {
        if (isEmployee) return null; // Don't show for employees
        const listRow = row as ExtendedListInvoice;
        return listRow.aiVerdict;
    }

    // Helper to get date safely
    const getDate = (row: AnyInvoice): string | undefined => {
        const listRow = row as ExtendedListInvoice;
        const myRow = row as ExtendedMyInvoice;

        if (isEmployee) {
            // Use type assertion to access potentially undefined properties
            return (myRow as any).uploadedAt || (myRow as any).invoiceDate || (myRow as any).createdAt;
        }
        return listRow.date || listRow.invoiceDate || (listRow as any).createdAt;
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("invoiceNumber")}>
                                Invoice No.
                                {sortBy === "invoiceNumber" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        </TableHead>

                        {showCompany(mode) && !showOrgColumn && (
                            <TableHead className="px-4 py-4 font-bold text-base text-foreground">Company</TableHead>
                        )}

                        {showOrgColumn && (
                            <TableHead className="px-4 py-4">
                                <div className="flex items-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("organizationName")}>
                                    Organization/Company
                                    {sortBy === "organizationName" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                        )}

                        {/* Date Column */}
                        <TableHead className="px-4 py-4">
                            <div className="flex items-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("invoiceDate")}>
                                {isEmployee ? "Uploaded At" : "Invoice Date"}
                                {sortBy === "invoiceDate" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        </TableHead>

                        {/* Amount Column */}
                        <TableHead className="px-4 py-4">
                            <div className="flex items-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("totalAmount")}>
                                Amount
                                {sortBy === "totalAmount" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        </TableHead>

                        {/* AI Verdict Column - Only show for non-employees */}
                        {!isEmployee && (
                            <TableHead className="px-4 py-4 font-bold text-base text-foreground text-center">AI Verdict</TableHead>
                        )}

                        {/* Status Column */}
                        <TableHead className="px-4 py-4">
                            <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("reviewDecision")}>
                                Status
                                {sortBy === "reviewDecision" ? (order === "asc" ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                            </div>
                        </TableHead>

                        <TableHead className="px-4 py-4 font-bold text-base text-foreground text-center">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoices.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={isEmployee ? 8 : 9} className="h-24 text-center text-muted-foreground">
                                No invoices found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        invoices.map((row) => {
                            const id = row.id || (row as any)._id
                            const listRow = row as ExtendedListInvoice
                            const myRow = row as ExtendedMyInvoice
                            const amount = getAmount(row)
                            const date = getDate(row)
                            const aiVerdict = !isEmployee ? listRow.aiVerdict : null

                            // Format date safely
                            const formatDate = (dateString?: string) => {
                                if (!dateString) return "—"
                                try {
                                    return new Date(dateString).toLocaleDateString()
                                } catch {
                                    return "—"
                                }
                            }

                            return (
                                <TableRow key={id} className="h-16 hover:bg-muted/30 transition-colors border-b border-border/50">
                                    <TableCell className="px-4 text-center font-bold text-base text-foreground">
                                        {row.invoiceNumber || "—"}
                                    </TableCell>

                                    {showCompany(mode) && !showOrgColumn && (
                                        <TableCell className="px-4 font-bold text-base text-foreground">
                                            {listRow.companyName || "—"}
                                        </TableCell>
                                    )}

                                    {showOrgColumn && (
                                        <TableCell className="px-4 font-bold text-base text-foreground">
                                            {getOrganizationName(row)}
                                        </TableCell>
                                    )}

                                    {/* Date Cell */}
                                    <TableCell className="px-4 text-foreground">
                                        {formatDate(date)}
                                    </TableCell>

                                    {/* Amount Cell */}
                                    <TableCell className="px-4 font-bold text-base text-foreground">
                                        {amount != null ? `$${amount.toLocaleString()}` : "—"}
                                    </TableCell>

                                    {/* AI Verdict Cell - Only for non-employees */}
                                    {!isEmployee && (
                                        <TableCell className="px-4 text-center">
                                            {aiVerdict ? (
                                                <Badge className={`${getVerdictColor(aiVerdict.verdict)} rounded-md px-4 py-1 capitalize text-xs font-bold`}>
                                                    {aiVerdict.verdict}
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-muted text-muted-foreground border border-border rounded-md px-3 py-1 text-xs font-bold flex items-center gap-1 w-fit mx-auto">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Processing
                                                </Badge>
                                            )}
                                        </TableCell>
                                    )}

                                    {/* Status Cell */}
                                    <TableCell className="px-4 text-center">
                                        <Badge className={`${getStatusColor(row.status)} rounded-md px-4 py-1 capitalize text-xs font-bold`}>
                                            {row.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="px-4 text-center">
                                        <Link href={`${baseUrl}/${id}`}>
                                            <Button size="sm" className="font-bold h-8 px-6 rounded-md text-xs shadow-none bg-blue-500 hover:bg-blue-600 text-white">
                                                View
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )
                        })
                    )}
                </TableBody>
            </Table>
            {pagination && onPageChange && (
                <div className="px-3">
                    <DataPagination pagination={pagination} onPageChange={onPageChange} />
                </div>
            )}
        </div>
    )
}