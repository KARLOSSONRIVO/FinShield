import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Building2 } from "lucide-react"
import Link from "next/link"
import { SortConfig } from "../hooks/useAssignments"
import { DeleteAssignmentDialog } from "./DeleteAssignmentDialog"

interface AssignmentDisplay {
    _id: string
    companyName: string
    auditorName: string
    status: string
    taskName: string
    dueDate: Date
}

interface AssignmentTableProps {
    assignments: AssignmentDisplay[]
    sortConfig: SortConfig
    onSort: (key: any) => void
    onDelete: (id: string) => void
}

export function AssignmentTable({ assignments, sortConfig, onSort, onDelete }: AssignmentTableProps) {
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)

    const getSortIcon = (key: keyof AssignmentDisplay) => {
        if (sortConfig?.key === key) {
            return <ArrowUpDown className={`ml-2 h-4 w-4 ${sortConfig.direction === "asc" ? "text-primary" : "text-primary/70"}`} />
        }
        return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/30" />
    }

    return (
        <>
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[200px] px-6 py-4 text-black font-bold text-base">Current Company</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Auditor</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Status</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Current Assignment</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Current Due Date</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assignments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No assignments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            assignments.map((row) => (
                                <TableRow key={row._id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="font-bold text-base text-black">{row.companyName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
                                        {row.auditorName}
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        {/* Status Pill - Green for active, Red for inactive/others */}
                                        <div className={`${row.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                            {row.status}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
                                        {row.taskName}
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
                                        {new Date(row.dueDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Link to detail page/sub-page */}
                                            <Link href={`/admin/super-admin/assignments/${row.auditorName}`}>
                                                <Button size="sm" className="bg-[#3b5998] hover:bg-[#3b5998]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none">Assign</Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none"
                                                onClick={() => setAssignmentToDelete(row._id)}
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DeleteAssignmentDialog
                open={!!assignmentToDelete}
                onOpenChange={(open) => !open && setAssignmentToDelete(null)}
                onConfirm={() => {
                    if (assignmentToDelete) {
                        onDelete(assignmentToDelete)
                        setAssignmentToDelete(null)
                    }
                }}
            />
        </>
    )
}
