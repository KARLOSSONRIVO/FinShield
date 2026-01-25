"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { AuditLog } from "@/lib/types"

interface RegulatorAuditLogTableProps {
    logs: AuditLog[]
}

export function RegulatorAuditLogTable({ logs }: RegulatorAuditLogTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Entity ID</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => (
                    <TableRow key={log._id}>
                        <TableCell className="font-mono text-sm">{new Date(log.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                            <div>
                                <p className="font-medium">{log.actorName}</p>
                                <p className="text-xs text-muted-foreground">{log.actorEmail}</p>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{log.action.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="secondary">{log.entity_type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.entity_id}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
