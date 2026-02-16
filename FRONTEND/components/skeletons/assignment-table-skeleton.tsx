import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function AssignmentTableSkeleton() {
    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[200px] px-6 py-4"><Skeleton className="h-6 w-32" /></TableHead>
                        <TableHead className="w-[200px] px-6 py-4"><Skeleton className="h-6 w-24" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                            {/* Company */}
                            <TableCell className="px-6">
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </TableCell>
                            {/* Auditor */}
                            <TableCell className="px-6">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </TableCell>
                            {/* Status */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                            </TableCell>
                            {/* Assigned At */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-4 w-32 mx-auto" />
                            </TableCell>
                            {/* Action */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-8 w-20 rounded-md mx-auto" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
