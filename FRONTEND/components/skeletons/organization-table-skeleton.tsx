import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function OrganizationTableSkeleton() {
    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[300px] px-6 py-4"><Skeleton className="h-6 w-32" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-24 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-20 mx-auto" /></TableHead>
                        <TableHead className="px-6 py-4 text-center"><Skeleton className="h-6 w-16 mx-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                            {/* Name */}
                            <TableCell className="px-6">
                                <div className="flex flex-col gap-2">
                                    <Skeleton className="h-5 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </TableCell>
                            {/* Type */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                            </TableCell>
                            {/* Employees */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-5 w-8 mx-auto" />
                            </TableCell>
                            {/* Created At */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-4 w-32 mx-auto" />
                            </TableCell>
                            {/* Status */}
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-6 w-20 rounded-full mx-auto" />
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
