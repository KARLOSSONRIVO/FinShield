"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface AddEmployeeDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    newUser: any // Using specific type would be better but keeping it simple for now matching mock/usage
    setNewUser: (user: any) => void
}

export function AddEmployeeDialog({ isOpen, onOpenChange, onSubmit, newUser, setNewUser }: AddEmployeeDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>Create a new employee account for your company</DialogDescription>

                </DialogHeader>

                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="employee@acme.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            required
                            maxLength={100}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="john_doe"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            required
                            pattern="^[a-zA-Z0-9_]+$"
                            minLength={3}
                            maxLength={20}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tempPassword">Temporary Password</Label>
                        <Input
                            id="tempPassword"
                            type="password"
                            placeholder="••••••••"
                            disabled
                            value="Password123!"
                        />
                        <p className="text-xs text-muted-foreground">
                            Employee will be required to change password on first login
                        </p>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                        Cancel
                    </Button>
                    <Button type="submit">Create Employee</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}
