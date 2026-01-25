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
}

export function AddEmployeeDialog({ isOpen, onOpenChange, onSubmit }: AddEmployeeDialogProps) {
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
                <form className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" placeholder="employee@acme.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" placeholder="john_doe" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tempPassword">Temporary Password</Label>
                        <Input id="tempPassword" type="password" placeholder="••••••••" />
                        <p className="text-xs text-muted-foreground">
                            Employee will be required to change password on first login
                        </p>
                    </div>
                </form>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit}>Create Employee</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
