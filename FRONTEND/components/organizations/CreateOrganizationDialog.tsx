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

interface CreateOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newOrgName: string
    setNewOrgName: (name: string) => void
    onCreateOrg: () => void
}

export function CreateOrganizationDialog({
    open,
    onOpenChange,
    newOrgName,
    setNewOrgName,
    onCreateOrg,
}: CreateOrganizationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>Add a new company organization to the platform</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name</Label>
                        <Input
                            id="orgName"
                            placeholder="Enter company name"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onCreateOrg}>Create Organization</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
