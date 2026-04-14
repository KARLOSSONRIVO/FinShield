"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import { X } from "lucide-react"

interface AddEmployeeDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: () => void
    newUser: any
    setNewUser: (user: any) => void
}

export function AddEmployeeDialog({ isOpen, onOpenChange, onSubmit, newUser, setNewUser }: AddEmployeeDialogProps) {

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="text-xl font-normal">Add New Employee</DialogTitle>
                    <DialogClose className="opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>

                <form
                    className="flex flex-col pt-4 gap-4"
                    onSubmit={(e) => {
                        e.preventDefault()
                        onSubmit()
                    }}
                >
                    <div className="grid gap-2">
                        <Label htmlFor="username" className="font-bold text-base">Username</Label>
                        <Input
                            id="username"
                            placeholder="eg. john_doe"
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
                        <Label htmlFor="email" className="font-bold text-base">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="eg. employee@acme.com"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="border border-black rounded-lg h-11"
                            required
                            maxLength={100}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Temporary Password</Label>
                        <Input
                            type="text"
                            disabled
                            value="Password123!"
                            className="border border-black rounded-lg h-11 bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            Employee will be required to change password on first login
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="w-full bg-[#00C28C] hover:bg-[#00C28C]/90 text-white font-bold h-11 rounded-lg text-base">
                            Create Employee
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
