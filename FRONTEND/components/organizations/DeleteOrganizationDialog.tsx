"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Organization } from "@/services/organization.service"

interface DeleteOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    organization: Organization | null
    onConfirm: (id: string) => void
}

export function DeleteOrganizationDialog({
    open,
    onOpenChange,
    organization,
    onConfirm,
}: DeleteOrganizationDialogProps) {
    if (!organization) return null

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete
                        <span className="font-bold text-foreground"> {organization.name} </span>
                        and remove their data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => organization.id && onConfirm(organization.id)}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Delete Organization
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
