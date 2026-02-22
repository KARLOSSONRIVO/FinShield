"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { DialogFooter } from "@/components/ui/dialog"

interface MfaLoginDialogProps {
    open: boolean
    tempToken: string
    onSuccess: (data: any) => void
    onCancel: () => void
}

export function MfaLoginDialog({ open, tempToken, onSuccess, onCancel }: MfaLoginDialogProps) {
    const [token, setToken] = useState("")

    const verifyMutation = useMutation({
        mutationFn: AuthService.verifyMfa,
        onSuccess: (data) => {
            toast.success("Authentication successful")
            onSuccess(data)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Invalid code")
            setToken("") // Clear on error
        },
    })

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (token.length !== 6) return
        verifyMutation.mutate({ tempToken, token })
    }

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
            <DialogContent className="sm:max-w-[400px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>MFA Verification</DialogTitle>
                    <DialogDescription>
                        Enter the 6-digit code from your authenticator app.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={token}
                            onChange={(val) => {
                                setToken(val)
                                if (val.length === 6) {
                                    // optional: auto-submit
                                }
                            }}
                            render={({ slots }) => (
                                <InputOTPGroup>
                                    {slots.map((slot, index) => (
                                        <InputOTPSlot key={index} {...slot} index={index} />
                                    ))}
                                </InputOTPGroup>
                            )}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={token.length !== 6 || verifyMutation.isPending}
                            isLoading={verifyMutation.isPending}
                            loadingText="Verifying..."
                        >
                            Verify
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
