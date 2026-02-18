import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/data-display/table'
import { Button } from "@/components/ui/button"
import { Building2, Pencil, Trash2 } from "lucide-react"
import { RealAssignment, SortConfig } from "@/hooks/assignments/use-assignments"
import { DeleteAssignmentDialog } from "./DeleteAssignmentDialog"
import { EditAssignmentDialog } from "./EditAssignmentDialog"
import { useAssignments } from "@/hooks/assignments/use-assignments"

interface AssignmentTableProps {
    assignments: RealAssignment[]
    sortConfig: SortConfig
    onSort: (key: any) => void
    onDelete: (id: string) => void
    onUpdate: (id: string, data: { status?: "active" | "inactive"; notes?: string }) => void
    companies: Organization[]
    auditors: User[]
}

export function AssignmentTable({ assignments, sortConfig, onSort, onDelete, onUpdate, companies, auditors }: AssignmentTableProps) {
    
    
    

    return (
        <AssignmentTableContent
            assignments={assignments}
            sortConfig={sortConfig}
            onSort={onSort}
            onDelete={onDelete}
            onUpdate={onUpdate}
            companies={companies}
            auditors={auditors}
        />
    )
}






import { components } from '@/types/api'
import { Organization } from "@/services/organization.service"
type User = components["schemas"]["User"]

export interface RealAssignmentTableProps {
    assignments: RealAssignment[]
    sortConfig: SortConfig
    onSort: (key: any) => void
    onDelete: (id: string) => void
    onUpdate: (id: string, data: { status?: "active" | "inactive"; notes?: string }) => void
    companies: Organization[]
    auditors: User[]
}

export function AssignmentTableContent({ assignments, sortConfig, onSort, onDelete, onUpdate, companies = [], auditors = [] }: RealAssignmentTableProps & { companies?: any[], auditors?: any[] }) {
    const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)
    const [assignmentToEdit, setAssignmentToEdit] = useState<RealAssignment | null>(null)

    const getCompanyName = (orgId: string) => companies.find(c => c.id === orgId)?.name || "Unknown Company"
    const getAuditorName = (userId: string) => {
        const user = auditors.find(u => u.id === userId)
        return user ? `${user.firstName} ${user.lastName}` : "Unknown Auditor"
    }

    return (
        <>
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[250px] px-6 py-4 text-black font-bold text-base">Company</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Auditor</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Status</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Assigned By</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Date Assigned</TableHead>
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
                                <TableRow key={row.id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                                    <TableCell className="px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="font-bold text-base text-black">{row.company?.name || getCompanyName(row.companyOrgId)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
                                        {row.auditor?.username || getAuditorName(row.auditorUserId)}
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className={`${row.status === 'active' ? 'bg-emerald-600' : 'bg-gray-500'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                            {row.status}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
                                        {row.assignedBy?.username || (row.assignedByUserId ? "Admin" : "System")}
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
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
                
                companyName={assignmentToEdit ? (assignmentToEdit.company?.name || getCompanyName(assignmentToEdit.companyOrgId)) : ""}
                auditorName={assignmentToEdit ? (assignmentToEdit.auditor?.username || getAuditorName(assignmentToEdit.auditorUserId)) : ""}
            />
        </>
    )
}
