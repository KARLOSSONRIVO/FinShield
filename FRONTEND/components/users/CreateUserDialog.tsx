"use client"

import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/layout/dialog'
import { Plus, X } from "lucide-react"
import type { Organization } from '@/types'

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
    const itemsDisabled = newUser.role === "AUDITOR" || newUser.role === "REGULATOR"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[825px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="text-xl font-normal">Add New User</DialogTitle>
                    <DialogClose className="opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-6 w-6" /> {}
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>

                <form
                    className="grid gap-4 py-4"
                    onSubmit={(e) => {
                        e.preventDefault()
                        onCreateUser()
                    }}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="username" className="font-bold text-base">Username</Label>
                        <Input
                            id="username"
                            placeholder="eg. username123"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            className="border border-black rounded-lg h-11"
                            required
                            pattern="^[a-zA-Z0-9_]+$"
                            minLength={3}
                            maxLength={20}
                            title="Username can only contain letters, numbers, and underscores (3-20 chars)"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email" className="font-bold text-base">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="eg. user@example.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="border border-black rounded-lg h-11"
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role" className="font-bold text-base">Role</Label>
                        <Select
                            value={newUser.role}
                            onValueChange={(v) => {
                                
                                const shouldClearOrg = v === "AUDITOR" || v === "REGULATOR"
                                setNewUser({
                                    ...newUser,
                                    role: v,
                                    orgId: shouldClearOrg ? "" : newUser.orgId
                                })
                            }}
                        >
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full">
                                <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                <SelectItem value="AUDITOR">Auditor</SelectItem>
                                <SelectItem value="REGULATOR">Regulator</SelectItem>
                                <SelectItem value="COMPANY_MANAGER">Company Manager</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label
                            htmlFor="org"
                            className={`font-bold text-base ${itemsDisabled ? "text-muted-foreground" : ""}`}
                        >
                            Company
                        </Label>
                        <Select
                            value={newUser.orgId}
                            onValueChange={(v) => setNewUser({ ...newUser, orgId: v })}
                            disabled={itemsDisabled}
                        >
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full disabled:opacity-50 disabled:cursor-not-allowed">
                                <SelectValue placeholder={itemsDisabled ? "Not applicable for this role" : "Select Company"} />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                {organizations
                                    .map((org) => (
                                        <SelectItem key={org._id} value={org._id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Password</Label>
                        <Input
                            type="password"
                            disabled
                            placeholder="Default: Password123!"
                            className="border border-black rounded-lg h-11 bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Default password will be set automatically.</p>
                    </div>


                    <DialogFooter className="px-6 pb-6">
                        <Button type="submit" className="w-full bg-[#00C28C] hover:bg-[#00C28C]/90 text-white font-bold h-11 rounded-lg text-base">
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
