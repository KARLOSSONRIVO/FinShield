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

import { useState, Fragment, useEffect } from "react"
import { DisableUserDialog } from "./DisableUserDialog"



interface UserTableProps {
    users: User[]
    onUpdateStatus: (userId: string, status: "ACTIVE" | "INACTIVE", reason?: string) => void
    renderSubComponent?: (user: User) => React.ReactNode
    pagination?: PaginationDetails
    onPageChange?: (page: number) => void
    sortBy?: string
    order?: "asc" | "desc"
    onSort?: (field: string) => void
    hideRoleAndOrg?: boolean
}

export function UserTable({ users, onUpdateStatus, renderSubComponent, pagination, onPageChange, sortBy, order, onSort, hideRoleAndOrg = false }: UserTableProps) {
    const [statusUpdate, setStatusUpdate] = useState<{ id: string, status: "ACTIVE" | "INACTIVE" } | null>(null)
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    useEffect(() => {
        console.log("Users Listing:", users);
    }, [users]);

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
                            <TableHead className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("username")}>
                                    Username
                                    {sortBy === 'username' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                            <TableHead className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("email")}>
                                    Email
                                    {sortBy === 'email' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                </div>
                            </TableHead>
                            {!hideRoleAndOrg && (
                                <>
                                    <TableHead className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2 cursor-pointer font-bold text-base text-foreground" onClick={() => onSort?.("role")}>
                                            Role
                                            {sortBy === 'role' ? (order === 'asc' ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />) : <ChevronUp className="h-4 w-4 text-muted-foreground/40" />}
                                        </div>
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
                                <TableCell colSpan={renderSubComponent ? 8 : 7} className="h-24 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user, index) => {
                                const subComponent = renderSubComponent ? renderSubComponent(user) : null
                                return (
                                    <Fragment key={user.id || user._id}>
                                        <TableRow className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                                            <TableCell className="px-6 text-center font-bold text-base text-foreground">
                                                {user.username}
                                            </TableCell>
                                            <TableCell className="px-6 text-center text-sm font-medium text-foreground">
                                                {user.email}
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
                                                <div className={`${user.status?.toUpperCase() === 'ACTIVE' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                                    {user.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 text-center font-bold text-base text-foreground">
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                                            </TableCell>
                                            <TableCell className="px-6 text-center">
                                                {user.status?.toUpperCase() === 'ACTIVE' ? (
                                                    <Button
                                                        size="sm"
                                                        className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none"
                                                        onClick={() => setStatusUpdate({ id: user.id || user._id, status: "INACTIVE" })}
                                                    >
                                                        Disable
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none"
                                                        onClick={() => setStatusUpdate({ id: user.id || user._id, status: "ACTIVE" })}
                                                    >
                                                        Enable
                                                    </Button>
                                                )}
                                            </TableCell>
                                            {renderSubComponent && (
                                                <TableCell className="w-[50px] px-2 text-center">
                                                    {subComponent && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => toggleRow(user.id || user._id || index.toString())}
                                                        >
                                                            {expandedRows.has(user.id || user._id || index.toString()) ?
                                                                <ChevronUp className="h-4 w-4" /> :
                                                                <ChevronDown className="h-4 w-4" />
                                                            }
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                        {subComponent && expandedRows.has(user.id || user._id || index.toString()) && (
                                            <TableRow className="bg-muted/30">
                                                <TableCell colSpan={hideRoleAndOrg ? 6 : 8} className="p-0 border-b-0">
                                                    <div className="p-4 border-t border-border/50">
                                                        {subComponent}
                                                    </div>
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
