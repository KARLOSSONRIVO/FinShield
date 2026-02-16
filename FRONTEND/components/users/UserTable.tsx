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
import { User } from "@/lib/types"
import { SortConfig } from "@/hooks/users/use-users"
import { ArrowUpDown } from "lucide-react"

import { useState } from "react"
import { DisableUserDialog } from "./DisableUserDialog"

import { ChevronDown, ChevronUp } from "lucide-react"

interface UserTableProps {
    users: User[]
    sortConfig: SortConfig
    onSort: (key: keyof User) => void
    onUpdateStatus: (userId: string, status: "ACTIVE" | "SUSPENDED", reason?: string) => void
    renderSubComponent?: (user: User) => React.ReactNode
}

export function UserTable({ users, sortConfig, onSort, onUpdateStatus, renderSubComponent }: UserTableProps) {
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
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[300px] px-6 py-4 text-black font-bold text-base">User Details</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Role</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Organization</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Status</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Last Login</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Action</TableHead>
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
                                    <>
                                        <TableRow key={user._id} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                                            <TableCell className="px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-base text-black">{user.username}</span>
                                                    <span className="text-sm text-black font-medium">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 text-center">
                                                <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider">
                                                    {user.role.replace(/_/g, " ")}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 text-center font-bold text-base text-black">
                                                {user.organizationName || (user.orgId === "org-platform" ? "FinShield Platform" : "Company User")}
                                            </TableCell>
                                            <TableCell className="px-6 text-center">
                                                <div className={`${user.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                                    {user.status}
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-6 text-center font-bold text-base text-black">
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                                            </TableCell>
                                            <TableCell className="px-6 text-center">
                                                {user.status === 'active' ? (
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
                                    </>
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
        </>
    )
}
