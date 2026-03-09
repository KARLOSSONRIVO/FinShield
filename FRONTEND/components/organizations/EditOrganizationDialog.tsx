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
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Edit Organization</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4 px-2">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="name" className="text-left font-bold">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="type" className="text-left font-bold">
                            Type
                        </Label>
                        <Select
                            value={type}
                            onValueChange={setType}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="COMPANY">Company</SelectItem>
                                <SelectItem value="ORGANIZATION">Organization</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="status" className="text-left font-bold mt-2">
                            Status
                        </Label>
                        <Select
                            value={status}
                            onValueChange={(val) => setStatus(val as OrganizationStatus)}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">Active</SelectItem>
                                <SelectItem value="INACTIVE">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="px-2 pb-2 mt-4 space-x-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 !text-white font-bold"
                    >
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}