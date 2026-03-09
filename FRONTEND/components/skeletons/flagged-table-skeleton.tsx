import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function FlaggedTableSkeleton() {
    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[150px] px-6 py-4"><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead className="w-[150px] px-6 py-4"><Skeleton className="h-4 w-20" /></TableHead>
                        <TableHead className="w-[150px] px-6 py-4"><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead className="min-w-[200px] px-6 py-4"><Skeleton className="h-4 w-32" /></TableHead>
                        <TableHead className="w-[150px] px-6 py-4"><Skeleton className="h-4 w-24" /></TableHead>
                        <TableHead className="w-[150px] px-6 py-4 text-center"><Skeleton className="h-4 w-24 mx-auto" /></TableHead>
                        <TableHead className="w-[100px] px-6 py-4 text-center"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                            <TableCell className="px-6 text-sm font-medium text-foreground">
                                <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell className="px-6 text-sm font-medium text-foreground">
                                <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell className="px-6 text-sm font-bold text-foreground">
                                <Skeleton className="h-4 w-28" />
                            </TableCell>
                            <TableCell className="px-6">
                                <Skeleton className="h-4 w-48" />
                            </TableCell>
                            <TableCell className="px-6 text-sm text-muted-foreground whitespace-nowrap">
                                <Skeleton className="h-4 w-32" />
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <Skeleton className="h-6 w-24 rounded-full mx-auto" />
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
