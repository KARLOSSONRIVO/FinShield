"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { toast } from "sonner"
import { Loader2, Copy, CheckCircle } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"

export function MfaSetupDialog({
    children,
    onSuccess,
}: {
    children?: React.ReactNode
    onSuccess?: () => void
}) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<"start" | "scan" | "success">("start")
    const [qrData, setQrData] = useState<{ secret: string; qrCodeUrl: string } | null>(null)
    const [token, setToken] = useState("")

    const setupMutation = useMutation({
        mutationFn: AuthService.setupMfa,
        onSuccess: (data) => {
            setQrData(data.data || data) // Backend wrapper might return { ok: true, data: ... } or just data
            setStep("scan")
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to start MFA setup")
        },
    })

    const enableMutation = useMutation({
        mutationFn: AuthService.enableMfa,
        onSuccess: () => {
            toast.success("MFA enabled successfully")
            setStep("success")
            onSuccess?.()
            setTimeout(() => setOpen(false), 2000)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Invalid code")
        },
    })

    const handleStart = () => {
        setupMutation.mutate()
    }

    const handleVerify = () => {
        if (token.length !== 6) return
        enableMutation.mutate({ token })
    }

    const copySecret = () => {
        if (qrData?.secret) {
            navigator.clipboard.writeText(qrData.secret)
            toast.success("Secret copied to clipboard")
        }
    }

    // Reset state when dialgo closes
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            setTimeout(() => {
                setStep("start")
                setQrData(null)
                setToken("")
            }, 300)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {children || <Button variant="outline">Enable MFA</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                        Protect your account with an extra layer of security.
                    </DialogDescription>
                </DialogHeader>

                {step === "start" && (
                    <div className="py-4">
                        <p className="text-sm text-muted-foreground mb-4">
                            You will need an authenticator app like Google Authenticator or Authy to complete this process.
                        </p>
                        <Button
                            onClick={handleStart}
                            disabled={setupMutation.isPending}
                            isLoading={setupMutation.isPending}
                            loadingText="Starting..."
                            className="w-full"
                        >
                            Start Setup
                        </Button>
                    </div>
                )}

                {step === "scan" && qrData && (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <div className="border p-2 rounded-lg bg-white">
                                {/* Backend returns data URL directly */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrData.qrCodeUrl} alt="MFA QR Code" className="w-48 h-48" />
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span className="font-mono">{qrData.secret}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copySecret}>
                                    <Copy className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="token" className="text-center block">
                                Enter 6-digit code
                            </Label>
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={token}
                                    onChange={setToken}
                                    render={({ slots }) => (
                                        <InputOTPGroup>
                                            {slots.map((slot, index) => (
                                                <InputOTPSlot key={index} {...slot} index={index} />
                                            ))}
                                        </InputOTPGroup>
                                    )}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={handleVerify}
                            disabled={token.length !== 6 || enableMutation.isPending}
                            isLoading={enableMutation.isPending}
                            loadingText="Verifying..."
                            className="w-full"
                        >
                            Verify & Enable
                        </Button>
                    </div>
                )}

                {step === "success" && (
                    <div className="flex flex-col items-center justify-center py-6 space-y-4 text-center">
                        <div className="rounded-full bg-green-100 p-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">MFA Enabled</h3>
                            <p className="text-sm text-muted-foreground">
                                Your account is now secured with two-factor authentication.
                            </p>
                        </div>
                        <Button className="w-full" onClick={() => setOpen(false)}>
                            Done
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
