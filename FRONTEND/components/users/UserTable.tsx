"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { User, PaginationDetails } from "@/lib/types"
import { DataPagination } from "../common/DataPagination"
import { ChevronUp, ChevronDown } from "lucide-react"

import { useState, Fragment } from "react"
import { DisableUserDialog } from "./DisableUserDialog"



interface UserTableProps {
    users: User[]
    onUpdateStatus: (userId: string, status: "ACTIVE" | "SUSPENDED", reason?: string) => void
    renderSubComponent?: (user: User) => React.ReactNode
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
    hideRoleAndOrg?: boolean
}

export function UserTable({ users, onUpdateStatus, renderSubComponent, pagination, onPageChange, sortBy, order, onSort, hideRoleAndOrg = false }: UserTableProps) {
    const [statusUpdate, setStatusUpdate] = useState<{ id: string, status: "ACTIVE" | "SUSPENDED" } | null>(null)
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const toggleRow = (userId: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(userId)) {
            newExpanded.delete(userId)
        } else {
            newExpanded.add(userId)
        }
        setExpandedRows(newExpanded)
    }

    return (
        <>
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[300px] px-6 py-4">
                                <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("username")}>
                                    User Details
                                    {sortBy === 'username' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                            {!hideRoleAndOrg && (
                                <>
                                    <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">
                                        Role
                                    </TableHead>
                                    <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Organization</TableHead>
                                </>
                            )}
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">
                                Status
                            </TableHead>
                            <TableHead className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("lastLoginAt")}>
                                    Last Login
                                    {sortBy === 'lastLoginAt' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                            <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Action</TableHead>
                            {renderSubComponent && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={renderSubComponent ? 7 : 6} className="h-24 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => {
                                const subComponent = renderSubComponent ? renderSubComponent(user) : null
                                return (
                                    <Fragment key={user._id}>
                                        <TableRow className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                                            <TableCell className="px-6 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold text-base text-foreground">{user.username}</span>
                                                    <span className="text-sm text-foreground font-medium">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            {!hideRoleAndOrg && (
                                                <>
                                                    <TableCell className="px-6 text-center">
                                                        <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider">
                                                            {user.role.replace(/_/g, " ")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 text-center font-bold text-base text-foreground">
                                                        {user.organizationName || (user.orgId === "org-platform" ? "FinShield Platform" : "Company User")}
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell className="px-6 text-center">
                                                <div className={`${user.status.toLowerCase() === 'active' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                                    {user.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 text-center font-bold text-base text-foreground">
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                                            </TableCell>
                                            <TableCell className="px-6 text-center">
                                                {user.status.toLowerCase() === 'active' ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none"
                                                        onClick={() => setStatusUpdate({ id: user._id, status: "SUSPENDED" })}
                                                    >
                                                        Disable
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none"
                                                        onClick={() => setStatusUpdate({ id: user._id, status: "ACTIVE" })}
                                                    >
                                                        Enable
                                                    </Button>
                                                )}
                                            </TableCell>
                                            {renderSubComponent && (
                                                <TableCell>
                                                    {subComponent && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleRow(user._id)}
                                                        >
                                                            {expandedRows.has(user._id) ?
                                                                <ChevronUp className="h-4 w-4" /> :
                                                                <ChevronDown className="h-4 w-4" />
                                                            }
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                        {subComponent && expandedRows.has(user._id) && (
                                            <TableRow className="bg-muted/5">
                                                <TableCell colSpan={7} className="p-4">
                                                    {subComponent}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <DisableUserDialog
                open={!!statusUpdate}
                title={statusUpdate?.status === "ACTIVE" ? "Enable User" : "Disable User"}
                description={statusUpdate?.status === "ACTIVE"
                    ? "Are you sure you want to enable this user? They will regain access to the platform."
                    : "Are you sure you want to disable this user? They will lose access to the platform."}
                confirmText={statusUpdate?.status === "ACTIVE" ? "Enable User" : "Disable User"}
                confirmVariant={statusUpdate?.status === "ACTIVE" ? "default" : "destructive"}
                onOpenChange={(open) => !open && setStatusUpdate(null)}
                onConfirm={(reason) => {
                    if (statusUpdate) {
                        onUpdateStatus(statusUpdate.id, statusUpdate.status, reason)
                        setStatusUpdate(null)
                    }
                }}
            />

            {pagination && onPageChange && (
                <DataPagination pagination={pagination} onPageChange={onPageChange} />
            )}
        </>
    )
}
