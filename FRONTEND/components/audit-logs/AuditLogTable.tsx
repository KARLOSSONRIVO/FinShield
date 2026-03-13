"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AuditLog } from "@/lib/types"
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditLogTableProps {
    logs: AuditLog[]
    sortConfig?: { key: string; direction: 'asc' | 'desc' } | null
    requestSort?: (key: string) => void
}

export function AuditLogTable({ logs, sortConfig, requestSort }: AuditLogTableProps) {
    const renderSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-4 w-4 text-emerald-600" /> : <ChevronDown className="ml-2 h-4 w-4 text-emerald-600" />
    }

    const SortableHeader = ({ label, sortKey, className }: { label: string; sortKey?: string; className?: string }) => {
        if (!sortKey || !requestSort) {
            return <TableHead className={cn("px-6 py-4 text-foreground font-bold text-base whitespace-nowrap", className)}>{label}</TableHead>
        }

        return (
            <TableHead
                className={cn("px-6 py-4 text-foreground font-bold text-base whitespace-nowrap cursor-pointer hover:bg-muted/50 transition-colors group", className)}
                onClick={() => requestSort(sortKey)}
            >
                <div className="flex items-center">
                    {label}
                    {renderSortIcon(sortKey)}
                </div>
            </TableHead>
        )
    }

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm px-3 py-2 overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <SortableHeader label="Timestamp" sortKey="createdAt" />
                        <SortableHeader label="Actor" />
                        <SortableHeader label="Action" className="text-center" />
                        <SortableHeader label="Target Type" className="text-center" />
                        <SortableHeader label="IP Address" />
                        <SortableHeader label="User Agent" />
                        <SortableHeader label="Summary" className="w-full" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No audit logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((row) => (
                            <TableRow key={row.id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-6 font-bold text-base text-foreground whitespace-nowrap">
                                    {new Date(row.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell className="px-6 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-sm uppercase">{row.actorRole?.replace(/_/g, " ")}</span>
                                        <span className="text-xs text-muted-foreground">{row.actor?.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-center whitespace-nowrap">
                                    <div className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-md text-[10px] font-bold inline-block uppercase tracking-wider cursor-pointer shadow-sm">
                                        {String(row.action).replace(/_/g, " ")}
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-center whitespace-nowrap">
                                    <div className="bg-emerald-600/10 text-emerald-800 px-4 py-1.5 rounded-md text-[11px] font-bold inline-block uppercase tracking-wider border border-emerald-200">
                                        {row.targetType || "-"}
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-sm text-foreground font-mono whitespace-nowrap">
                                    {row.ip || "-"}
                                </TableCell>
                                <TableCell className="px-6 text-xs text-muted-foreground truncate max-w-[200px]" title={row.userAgent}>
                                    {row.userAgent || "-"}
                                </TableCell>
                                <TableCell className="px-6 text-sm text-foreground w-full max-w-sm">
                                    <div className="line-clamp-2 whitespace-normal break-words" title={row.summary}>
                                        {row.summary}
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
