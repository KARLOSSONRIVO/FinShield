"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Organization } from "@/services/organization.service"
import { AlertTriangle } from "lucide-react"

interface DeleteOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization: Organization | null
    onConfirm: () => void
    isLoading?: boolean
}

export function DeleteOrganizationDialog({
    open,
    onOpenChange,
    organization,
    onConfirm,
    isLoading = false,
}: DeleteOrganizationDialogProps) {
    if (!organization) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Organization
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        Are you sure you want to delete <span className="font-bold">{organization.name}</span>?
                        This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? "Deleting..." : "Delete Organization"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}