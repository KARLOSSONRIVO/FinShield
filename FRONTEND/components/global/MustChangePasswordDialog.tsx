"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { useAuthContext } from "@/providers/auth-provider"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

interface MustChangePasswordDialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    onCancel?: () => void
}

export function MustChangePasswordDialog({
    open: externalOpen,
    onOpenChange,
    onCancel
}: MustChangePasswordDialogProps) {
    const { user, refreshUser, login } = useAuthContext()
    const queryClient = useQueryClient()
    const [hasChanged, setHasChanged] = useState(false)
    const [shouldBlock, setShouldBlock] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [error, setError] = useState("")

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // Determine if dialog should be open
    const isOpen = externalOpen !== undefined
        ? externalOpen
        : !!(user as any)?.mustChangePassword && !hasChanged && !shouldBlock

    const { mutate: changePassword, isPending } = useMutation({
        mutationFn: (data: { currentPassword: string; newPassword: string }) =>
            AuthService.changePassword(data),
        onSuccess: async () => {
            toast.success("Password updated successfully! Logging you back in...")

            // Set flags immediately to prevent re-opening
            setHasChanged(true)
            setShouldBlock(true)

            // Close the dialog
            if (onOpenChange) {
                onOpenChange(false)
            }

            // Reset form
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setError("")

            try {
                // Clear all stored tokens
                localStorage.removeItem("token")
                localStorage.removeItem("refreshToken")
                localStorage.removeItem("user")

                // Clear all cookies
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

                // Clear React Query cache
                await queryClient.clear()

                // Log back in with the new password
                if (user?.email) {
                    await login({
                        email: user.email,
                        password: newPassword
                    })

                    // Force a hard reload to ensure all components get fresh state
                    setTimeout(() => {
                        window.location.href = window.location.pathname
                    }, 100)
                } else {
                    // If no email, redirect to login
                    window.location.href = "/login"
                }
            } catch (error) {
                console.error("Error during re-authentication:", error)
                // If re-login fails, redirect to login
                window.location.href = "/login"
            }
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || "Failed to change password"
            toast.error(msg)
            setError(msg)
        }
    })

    // Password requirements
    const requirements = useMemo(() => [
        { test: (p: string) => p.length >= 12, failMessage: "less than 12 characters" },
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

    const handleCancel = () => {
        if (onCancel) {
            onCancel()
        } else {
            // Fallback: original logout behavior
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("user")
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            window.location.href = "/login"
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} modal>
            <DialogContent
                className="max-w-md [&>button]:hidden"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                            <ShieldAlert className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">Password Change Required</DialogTitle>
                            <DialogDescription className="text-sm">
                                You must set a new password before accessing the platform.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Current password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="mcp-current" className="font-semibold">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="mcp-current"
                                type={showCurrent ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter your current password"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* New password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="mcp-new" className="font-semibold">New Password</Label>
                        <div className="relative">
                            <Input
                                id="mcp-new"
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                placeholder="Enter new password..."
                                className="pr-10"
                                minLength={12}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            12 characters, 1 number, 1 special character
                        </p>
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-1.5">
                        <Label htmlFor="mcp-confirm" className="font-semibold">Confirm Password</Label>
                        <div className="relative">
                            <Input
                                id="mcp-confirm"
                                type={showNew ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder="Re-enter your password..."
                                minLength={12}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
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
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-11"
                            disabled={isPending || !allGood}
                        >
                            {isPending ? "Updating..." : "Set New Password & Continue"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}