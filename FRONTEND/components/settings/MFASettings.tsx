"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/layout/dialog'
import { Lock, Smartphone, CheckCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { AuthService } from "@/services/auth.service"

export function MFASettings() {
    const { user, enableMfa, disableMfa } = useAuth()
    const [isLoading, setIsLoading] = useState(false)

    
    const [setupOpen, setSetupOpen] = useState(false)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [secret, setSecret] = useState<string | null>(null)
    const [otp, setOtp] = useState("")

    
    const [disableOpen, setDisableOpen] = useState(false)
    const [password, setPassword] = useState("")

    const handleStartSetup = async () => {
        setIsLoading(true)
        try {
            const response = await AuthService.setupMfa()
            if (response.data) {
                setQrCode(response.data.qrCodeUrl)
                setSecret(response.data.secret)
                setSetupOpen(true)
            } else {
                toast.error("Failed to start MFA setup")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to generate MFA secret")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEnableMfa = async () => {
        if (!otp || otp.length < 6) {
            toast.error("Please enter a valid 6-digit code")
            return
        }
        setIsLoading(true)
        try {
            await enableMfa(otp)
            toast.success("MFA enabled successfully")
            setSetupOpen(false)
            setOtp("")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to verify MFA code")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDisableMfa = async () => {
        if (!password) {
            toast.error("Please enter your password")
            return
        }
        setIsLoading(true)
        try {
            await disableMfa(password)
            toast.success("MFA disabled successfully")
            setDisableOpen(false)
            setPassword("")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to disable MFA")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm space-y-6">
            <div>
                <h4 className="font-semibold text-lg flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-emerald-500" />
                    Multi-Factor Authentication (MFA)
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                    Add an extra layer of security to your account by requiring a code from your authenticator app.
                </p>
            </div>

            <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${user?.mfaEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {user?.mfaEnabled ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div>
                        <p className="font-medium text-sm">Status: {user?.mfaEnabled ? "Enabled" : "Disabled"}</p>
                        <p className="text-xs text-muted-foreground">
                            {user?.mfaEnabled ? "Your account is secured with 2FA." : "Enable 2FA to protect your account."}
                        </p>
                    </div>
                </div>

                {user?.mfaEnabled ? (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDisableOpen(true)}
                    >
                        Turn Off
                    </Button>
                ) : (
                    <Button
                        onClick={handleStartSetup}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        size="sm"
                        disabled={isLoading}
                    >
                        {isLoading ? "Loading..." : "Turn On"}
                    </Button>
                )}
            </div>

            {}
            <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Setup Authenticator</DialogTitle>
                        <DialogDescription>
                            Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-4 py-4">
                        {qrCode ? (
                            <img src={qrCode} alt="MFA QR Code" className="w-48 h-48 border rounded-lg" />
                        ) : (
                            <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg animate-pulse" />
                        )}

                        {secret && (
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Or enter this code manually:</p>
                                <code className="bg-muted px-2 py-1 rounded text-sm font-mono select-all">
                                    {secret}
                                </code>
                            </div>
                        )}

                        <div className="w-full max-w-xs space-y-2 mt-2">
                            <Label htmlFor="otp">Enter 6-digit Code</Label>
                            <Input
                                id="otp"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                                className="text-center text-lg tracking-widest"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSetupOpen(false)}>Cancel</Button>
                        <Button onClick={handleEnableMfa} disabled={isLoading || otp.length !== 6}>
                            {isLoading ? "Verifying..." : "Verify & Enable"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {}
            <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disable MFA</DialogTitle>
                        <DialogDescription>
                            Please enter your password to confirm disabling Multi-Factor Authentication.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">Current Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDisableOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDisableMfa} disabled={isLoading || !password}>
                            {isLoading ? "Disabling..." : "Disable MFA"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
