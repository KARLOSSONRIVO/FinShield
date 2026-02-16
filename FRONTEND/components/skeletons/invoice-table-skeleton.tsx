import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function InvoiceTableSkeleton() {
    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[180px] px-6 py-4"><Skeleton className="h-5 w-24" /></TableHead>
                        <TableHead className="px-6 py-4"><Skeleton className="h-5 w-32" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-5 w-20 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-5 w-24 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-5 w-16 mx-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                            {/* Invoice No */}
                            <TableCell className="px-6 font-mono">
                                <Skeleton className="h-5 w-28" />
                            </TableCell>
                            {/* Organization/Company */}
                            <TableCell className="px-6">
                                <Skeleton className="h-5 w-40" />
                            </TableCell>
                            {/* Date */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-5 w-24 mx-auto" />
                            </TableCell>
                            {/* Amount */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-5 w-20 mx-auto" />
                            </TableCell>
                            {/* Status */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-6 w-24 rounded-full mx-auto" />
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
