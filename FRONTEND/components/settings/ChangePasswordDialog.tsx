"use client"

import { useState, useMemo } from "react"
import { useMutation } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, KeyRound } from "lucide-react"
import { toast } from "sonner"

interface ChangePasswordDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [error, setError] = useState("")

    const { mutate: changePassword, isPending } = useMutation({
        mutationFn: AuthService.changePassword,
        onSuccess: () => {
            onOpenChange(false)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setError("")
            toast.success("Password changed successfully!")
        },
        onError: (err: any) => {
            console.error(err)
            const msg = err.response?.data?.message || "Failed to change password"
            setError(msg)
            toast.error(msg)
        }
    })

    const requirements = useMemo(() => [
        { test: (p: string) => p.length >= 12, failMessage: "less than 12 characters" },
        { test: (p: string) => /[A-Z]/.test(p), failMessage: "missing an uppercase letter" },
        { test: (p: string) => /[0-9]/.test(p), failMessage: "missing a number" },
        { test: (p: string) => /[^A-Za-z0-9]/.test(p), failMessage: "missing a special character" },
    ], [])

    // Get status messages
    const getPasswordStatus = () => {
        if (newPassword !== confirmPassword && confirmPassword.length > 0) {
            return { message: "Passwords do not match", isError: true }
        }

        const failing = requirements
            .filter(req => !req.test(newPassword))
            .map(req => req.failMessage)

        if (failing.length === 0) {
            return { message: "All requirements met", isError: false }
        }

        let message = failing.join(", ")
        message = message.charAt(0).toUpperCase() + message.slice(1)
        return { message, isError: true }
    }

    const status = getPasswordStatus()
    const allGood = status.message === "All requirements met" && newPassword === confirmPassword && confirmPassword.length > 0

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!allGood) {
            setError(status.message)
            return
        }

        if (newPassword === currentPassword) {
            setError("New password must be different from your current password")
            return
        }

        changePassword({ currentPassword, newPassword })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md [&>button]:hidden">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                            <KeyRound className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">Change Password</DialogTitle>
                            <DialogDescription className="text-sm">
                                Enter your current password and a new password to update your credentials.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Current password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="current-password" className="font-semibold">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="current-password"
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter your current password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="new-password" className="font-semibold">New Password</Label>
                        <div className="relative">
                            <Input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="Enter new password..."
                                className="pr-10"
                                minLength={12}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            12 chars minimum, 1 uppercase, 1 number, 1 special char
                        </p>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="confirm-password" className="font-semibold">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="confirm-password"
                                type={showNewPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Re-enter your password..."
                                minLength={12}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>

                        {confirmPassword.length > 0 && (
                            <p className={`text-xs ${status.isError ? "text-red-500" : "text-emerald-600"}`}>
                                {status.message}
                            </p>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            disabled={isPending}
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                            disabled={isPending || !allGood}
                        >
                            {isPending ? "Updating..." : "Update Password"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
