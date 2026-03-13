"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { X } from "lucide-react"
import { Organization } from "@/services/organization.service"
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
            <DialogContent className="sm:max-w-[400px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
                    <DialogTitle className="text-xl font-normal">Organization Details</DialogTitle>
                    <DialogClose className="opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="py-2 space-y-4">
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
                                <Badge
                                    variant="outline"
                                    className={organization?.status?.toUpperCase() === 'ACTIVE'
                                        ? "bg-emerald-600 text-white border-0"
                                        : "bg-red-600 text-white border-0"
                                    }
                                >
                                    {organization.status || "N/A"}
                                </Badge>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Date Created</label>
                            <p className="text-sm font-medium mt-1">
                                {organization.createdAt ? new Date(organization.createdAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : "N/A"}
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}