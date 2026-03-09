import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function AuditLogTableSkeleton() {
    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="px-6 py-4 w-[200px]"><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead className="px-6 py-4 w-[150px]"><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead className="px-6 py-4 min-w-[300px]"><Skeleton className="h-4 w-32" /></TableHead>
                        <TableHead className="px-6 py-4 w-[250px]"><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead className="px-6 py-4 w-[150px] text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                            <TableCell className="px-6 py-4 align-top">
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </TableCell>
                            <TableCell className="px-6 py-4 align-top">
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </TableCell>
                            <TableCell className="px-6 py-4 align-top">
                                <Skeleton className="h-4 w-full max-w-[400px]" />
                            </TableCell>
                            <TableCell className="px-6 py-4 align-top">
                                <div className="flex items-start gap-3">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <div className="space-y-2 mt-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center align-top">
                                <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center align-top">
                                <Skeleton className="h-8 w-8 mx-auto" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
