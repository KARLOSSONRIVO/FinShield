"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import type { Organization } from "@/lib/types"

interface CreateUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newUser: { email: string; username: string; role: string; orgId: string }
    setNewUser: (user: any) => void
    organizations: Organization[]
    onCreateUser: () => void
}

export function CreateUserDialog({
    open,
    onOpenChange,
    newUser,
    setNewUser,
    organizations,
    onCreateUser,
}: CreateUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Add a new auditor, regulator, or company manager</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="user@example.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="AUDITOR">Auditor</SelectItem>
                                <SelectItem value="REGULATOR">Regulator</SelectItem>
                                <SelectItem value="COMPANY_MANAGER">Company Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {newUser.role === "COMPANY_MANAGER" && (
                        <div className="space-y-2">
                            <Label htmlFor="org">Organization</Label>
                            <Select value={newUser.orgId} onValueChange={(v) => setNewUser({ ...newUser, orgId: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations
                                        .filter((o) => o.type === "company")
                                        .map((org) => (
                                            <SelectItem key={org._id} value={org._id}>
                                                {org.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onCreateUser}>Create User</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
