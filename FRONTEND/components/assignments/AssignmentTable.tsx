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
import { Building2, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { RealAssignment } from "@/hooks/assignments/use-assignments"
import { DeleteAssignmentDialog } from "./DeleteAssignmentDialog"
import { EditAssignmentDialog } from "./EditAssignmentDialog"
import { useAssignments } from "@/hooks/assignments/use-assignments"
import { PaginationDetails } from "@/lib/types"
import { DataPagination } from "../common/DataPagination"

interface AssignmentTableProps {
    assignments: RealAssignment[]
    onDelete: (id: string) => void
    onUpdate: (id: string, data: { status?: "active" | "inactive"; notes?: string }) => void
    companies: Organization[]
    auditors: User[]
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
}

export function AssignmentTable({ assignments, onDelete, onUpdate, companies, auditors, pagination, onPageChange, sortBy, order, onSort }: AssignmentTableProps) {
    // ... (state hooks are inside content, but wrapper is fine)
    // Actually wrapper was wrapping content. 
    // We can just pass props through.

    return (
        <AssignmentTableContent
            assignments={assignments}
            onDelete={onDelete}
            onUpdate={onUpdate}
            companies={companies}
            auditors={auditors}
            pagination={pagination}
            onPageChange={onPageChange}
            sortBy={sortBy}
            order={order}
            onSort={onSort}
        />
    )
}

// Breaking component to allow "using hook data" if needed, 
// BUT better plan: Update parent to pass data.
// For now, I'll assume the parent *will* pass them in the next step.
// Let's modify the Props to accept helper data.

import { components } from "@/lib/api-types"
import { Organization } from "@/services/organization.service"
type User = components["schemas"]["User"]

export interface RealAssignmentTableProps {
    assignments: RealAssignment[]
    onDelete: (id: string) => void
    onUpdate: (id: string, data: { status?: "active" | "inactive"; notes?: string }) => void
    companies: Organization[]
    auditors: User[]
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
}

export function AssignmentTableContent({ assignments, onDelete, onUpdate, companies = [], auditors = [], pagination, onPageChange, sortBy, order, onSort }: RealAssignmentTableProps & { companies?: any[], auditors?: any[] }) {
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)
    const [assignmentToEdit, setAssignmentToEdit] = useState<RealAssignment | null>(null)

    const getCompanyName = (orgId: string) => companies.find((c: any) => c.id === orgId || c._id === orgId)?.name || "Unknown Company"
    const getAuditorName = (userId: string) => {
        const user = auditors.find((u: any) => u.id === userId || u._id === userId)
        return user ? `${user.firstName} ${user.lastName}` : "Unknown Auditor"
    }

    return (
        <>
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[250px] px-6 py-4 text-center text-foreground font-bold text-base">
                                Company
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">
                                Auditor
                            </TableHead>
                            <TableHead className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("status")}>
                                    Status
                                    {sortBy === 'status' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">
                                Assigned By
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">
                                Date Assigned
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Action</TableHead>
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
                                <TableRow key={row.id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                    <TableCell className="px-6 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="font-bold text-base text-foreground">{row.company?.name || getCompanyName(row.companyOrgId)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-foreground">
                                        {row.auditor?.username || getAuditorName(row.auditorUserId)}
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className={`${row.status === 'active' ? 'bg-emerald-600' : 'bg-gray-500'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                            {row.status}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-foreground">
                                        {row.assignedBy?.username || (row.assignedByUserId ? "Admin" : "System")}
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-foreground">
                                        {row.assignedAt ? new Date(row.assignedAt).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-[#3b5998] hover:bg-[#3b5998]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none gap-2"
                                                onClick={() => setAssignmentToEdit(row)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none gap-2"
                                                onClick={() => setAssignmentToDelete(row.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
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

            <EditAssignmentDialog
                open={!!assignmentToEdit}
                onOpenChange={(open) => !open && setAssignmentToEdit(null)}
                assignment={assignmentToEdit}
                onUpdate={onUpdate}
                // Pass lookups to Dialog if needed for display, but Dialog is simple edit
                companyName={assignmentToEdit ? (assignmentToEdit.company?.name || getCompanyName(assignmentToEdit.companyOrgId)) : ""}
                auditorName={assignmentToEdit ? (assignmentToEdit.auditor?.username || getAuditorName(assignmentToEdit.auditorUserId)) : ""}
            />

            {pagination && onPageChange && (
                <DataPagination pagination={pagination} onPageChange={onPageChange} />
            )}
        </>
    )
}
