"use client"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Organization, OrganizationStatus } from "@/services/organization.service"
import { useState, useEffect } from "react"

interface EditOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization: Organization | null
    onSave: (org: Organization) => void
    isLoading?: boolean
}

export function EditOrganizationDialog({
    open,
    onOpenChange,
    organization,
    onSave,
    isLoading = false,
}: EditOrganizationDialogProps) {
    const [name, setName] = useState("")
    const [status, setStatus] = useState<OrganizationStatus>("ACTIVE")
    const [type, setType] = useState("COMPANY")

    // Reset form when organization changes
    useEffect(() => {
        if (organization) {
            setName(organization.name || "")
            setStatus(organization.status || "ACTIVE")
            setType(organization.type || "COMPANY")
        }
    }, [organization])

    const handleSave = () => {
        if (!organization) return
        onSave({
            ...organization,
            name,
            status: status as OrganizationStatus,
            type: type as "COMPANY" | "AUDITOR" | "REGULATOR"
        })
        onOpenChange(false)
    }

    if (!organization) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
                    <DialogTitle className="text-xl font-normal">Edit Organization</DialogTitle>
                    <DialogClose className="opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="font-bold text-base">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="border border-black rounded-lg h-11 w-full"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type" className="font-bold text-base">
                            Type
                        </Label>
                        <Select
                            value={type}
                            onValueChange={setType}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                <SelectItem value="COMPANY">Company</SelectItem>
                                <SelectItem value="ORGANIZATION">Organization</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="status" className="font-bold text-base">
                            Status
                        </Label>
                        <Select
                            value={status}
                            onValueChange={(val) => setStatus(val as OrganizationStatus)}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="w-full sm:justify-start">
                    <div className="flex w-full gap-3">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                            className="flex-1 border border-black rounded-lg h-11 font-bold text-base bg-white text-black hover:bg-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex-1 bg-[#00C28C] hover:bg-[#00C28C]/90 text-white font-bold h-11 rounded-lg text-base"
                        >
                            {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}