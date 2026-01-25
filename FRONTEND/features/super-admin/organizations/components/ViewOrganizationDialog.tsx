"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Organization } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

interface ViewOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization: Organization | null
}

export function ViewOrganizationDialog({
    open,
    onOpenChange,
    organization,
}: ViewOrganizationDialogProps) {
    if (!organization) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Organization Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                            <p className="text-base font-medium">{organization.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Type</label>
                            <div className="mt-1">
                                <Badge variant="outline" className="bg-emerald-600 text-white border-0">
                                    {organization.type}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="mt-1">
                                <Badge variant="outline" className={organization.status === 'active' ? "bg-emerald-600 text-white border-0" : "bg-red-600 text-white border-0"}>
                                    {organization.status}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Employees</label>
                            <p className="text-base font-medium">{organization.employees}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
                            <p className="text-sm font-mono bg-muted p-2 rounded-md mt-1">{organization._id}</p>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Joined Date</label>
                            <p className="text-base font-medium">{new Date(organization.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
