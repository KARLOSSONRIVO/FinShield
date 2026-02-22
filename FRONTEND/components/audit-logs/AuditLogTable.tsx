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

interface AuditLogTableProps {
    logs: AuditLog[]
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm px-3 py-2 overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base">Timestamp</TableHead>
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base">Actor</TableHead>
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base text-center">Action</TableHead>
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base text-center">Entity Type</TableHead>
                        <TableHead className="px-6 py-4 text-foreground font-bold text-base text-right">Entity ID</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                No audit logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((row) => (
                            <TableRow key={row._id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-6 font-bold text-base text-foreground">
                                    {new Date(row.createdAt).toLocaleString()}
                                </TableCell>
                                <TableCell className="px-6">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-base">{row.actorName || "System"}</span>
                                        <span className="text-xs text-muted-foreground">{row.actorEmail}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-center">
                                    <div className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-md text-[10px] font-bold inline-block uppercase tracking-wider cursor-pointer shadow-sm">
                                        {row.action.replace(/_/g, " ")}
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 text-center">
                                    <div className="bg-emerald-600 text-white px-4 py-1.5 rounded-md text-[10px] font-bold inline-block min-w-[80px] uppercase tracking-wider">
                                        {row.entity_type}
                                    </div>
                                </TableCell>
                                <TableCell className="px-6 font-mono text-sm text-gray-600 text-right">
                                    {row.entity_id}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
