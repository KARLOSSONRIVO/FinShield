"use client"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    const [status, setStatus] = useState<OrganizationStatus | string>("ACTIVE")

    // Reset form when organization changes
    useEffect(() => {
        if (organization) {
            setName(organization.name || "")
            setStatus(organization.status)
        } else {
            // Reset to a default if organization becomes null
            setStatus("ACTIVE")
        }
    }, [organization])

    const handleSave = () => {
        if (!organization) return
        onSave({
            ...organization,
            name,
            status: status as OrganizationStatus
        })
        onOpenChange(false)
    }

    if (!organization) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Edit Organization</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select value={status} onValueChange={(val) => setStatus(val as OrganizationStatus)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
