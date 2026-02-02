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

interface UserTableProps {
    users: User[]
    sortConfig: SortConfig
    onSort: (key: keyof User) => void
    onDisableUser: (userId: string) => void
}

export function UserTable({ users, sortConfig, onSort, onDisableUser }: UserTableProps) {
    const [userToDisable, setUserToDisable] = useState<string | null>(null)

    return (
        <>
            <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                            <TableHead className="w-[300px] px-6 py-4 text-black font-bold text-base">User</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Role</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Organization</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Status</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Last Login</TableHead>
                            <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user._id} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                                    <TableCell className="px-6">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-base text-black">{user.username}</span>
                                            <span className="text-sm text-black font-medium">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider">
                                            {user.role}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
                                        {user.orgId === "org-platform" ? "FinShield Platform" : "Company User"}
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <div className={`${user.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                            {user.status}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 text-center font-bold text-base text-black">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                                    </TableCell>
                                    <TableCell className="px-6 text-center">
                                        <Button
                                            size="sm"
                                            className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none"
                                            onClick={() => setUserToDisable(user._id)}
                                        >
                                            Disable
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DisableUserDialog
                open={!!userToDisable}
                onOpenChange={(open) => !open && setUserToDisable(null)}
                onConfirm={() => {
                    if (userToDisable) {
                        onDisableUser(userToDisable)
                        setUserToDisable(null)
                    }
                }}
            />
        </>
    )
}
