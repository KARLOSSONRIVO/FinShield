import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Building2, ChevronUp, ChevronDown } from "lucide-react"
import { Organization } from "@/services/organization.service"
import { PaginationDetails } from "@/lib/types"
import { DataPagination } from "../common/DataPagination"

import { useState } from "react"
import { ViewOrganizationDialog } from "./ViewOrganizationDialog"
import { EditOrganizationDialog } from "./EditOrganizationDialog"

interface OrganizationTableProps {
    organizations: any[]
    onEdit: (org: Organization) => void
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
    isUpdating?: boolean
}

export function OrganizationTable({
    organizations,
    onEdit,
    pagination,
    onPageChange,
    sortBy,
    order,
    onSort,
    isUpdating = false
}: OrganizationTableProps) {
    const [viewOrg, setViewOrg] = useState<Organization | null>(null)
    const [editOrg, setEditOrg] = useState<Organization | null>(null)

    return (
        <>
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[300px] px-6 py-4">
                                <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("name")}>
                                    Company Name
                                    {sortBy === 'name' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                            <TableHead className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("type")}>
                                    Type
                                    {sortBy === 'type' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">
                                Status
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {organizations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No organizations found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            organizations.map((org: any) => (
                                <TableRow key={org.id || org._id} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                                    <TableCell className="px-6 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                                <Building2 className="h-6 w-6 text-white" />
                                            </div>
                                            <span className="font-bold text-base text-foreground">{org.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className="bg-emerald-600 text-white px-3 py-1 rounded-md text-xs font-bold w-fit mx-auto uppercase tracking-wider">
                                            {org.type}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className={`${(org.status || '').toUpperCase() === 'ACTIVE' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1 rounded-md text-xs font-bold w-fit mx-auto uppercase tracking-wider`}>
                                            {org.status}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                className="bg-[#3b5998] hover:bg-[#3b5998]/90 text-white font-bold h-8 px-4 rounded-md text-xs"
                                                onClick={() => setViewOrg(org)}
                                                disabled={isUpdating}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-white font-bold h-8 px-4 rounded-md text-xs"
                                                onClick={() => setEditOrg(org)}
                                                disabled={isUpdating}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ViewOrganizationDialog
                open={!!viewOrg}
                onOpenChange={(open) => !open && setViewOrg(null)}
                organization={viewOrg}
            />

            <EditOrganizationDialog
                open={!!editOrg}
                onOpenChange={(open) => !open && setEditOrg(null)}
                organization={editOrg}
                onSave={onEdit}
                isLoading={isUpdating}
            />

            {pagination && onPageChange && (
                <DataPagination pagination={pagination} onPageChange={onPageChange} />
            )}
        </>
    )
}