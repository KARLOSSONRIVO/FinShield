import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function BlockchainTableSkeleton() {
    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[150px] px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></TableHead>
                        <TableHead className="w-[200px] px-6 py-4 text-center"><Skeleton className="h-4 w-20 mx-auto" /></TableHead>
                        <TableHead className="min-w-[300px] px-6 py-4 text-center"><Skeleton className="h-4 w-40 mx-auto" /></TableHead>
                        <TableHead className="w-[200px] px-6 py-4 text-center"><Skeleton className="h-4 w-28 mx-auto" /></TableHead>
                        <TableHead className="w-[150px] px-6 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
                        <TableHead className="w-[100px] px-6 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-4 w-24 mx-auto" />
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-4 w-32 mx-auto" />
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Skeleton className="h-8 w-8 rounded-full" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-4 w-36 mx-auto" />
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                            </TableCell>
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
