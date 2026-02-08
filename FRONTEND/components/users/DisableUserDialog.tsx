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

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"

interface DisableUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (reason?: string) => void
    title?: string
    description?: string
    confirmText?: string
    confirmVariant?: "default" | "destructive"
}

export function DisableUserDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Disable User Access?",
    description = "Are you sure you want to disable this user account? They will no longer be able to access the platform until re-enabled.",
    confirmText = "Disable User",
    confirmVariant = "destructive"
}: DisableUserDialogProps) {
    const [reason, setReason] = useState("")

    const handleConfirm = () => {
        onConfirm(reason)
        setReason("") // Reset after confirm
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {confirmVariant === "destructive" && (
                    <div className="py-2">
                        <label className="text-sm font-medium mb-2 block text-black">Reason for disabling:</label>
                        <Textarea
                            placeholder="Please provide a reason..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                )}

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={confirmVariant === "destructive" ? "bg-destructive hover:bg-destructive/90 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                        disabled={confirmVariant === "destructive" && reason.trim().length < 2}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
