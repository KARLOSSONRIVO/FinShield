"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function ChangePasswordPage() {
    const router = useRouter()
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")

    const { mutate: changePassword, isPending } = useMutation({
        mutationFn: AuthService.changePassword,
        onSuccess: (data) => {
            console.log("Password changed successfully", data)
            toast.success("Password changed successfully! Redirecting to login...")

            // Logout and redirect after a short delay to let the toast be seen
            setTimeout(() => {
                AuthService.logout()
                localStorage.removeItem("token")
                localStorage.removeItem("refreshToken")
                router.push("/login")
            }, 2000)
        },
        onError: (err: any) => {
            console.error(err)
            const msg = err.response?.data?.message || "Failed to change password"
            toast.error(msg)
            setError(msg)
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        const strictRegex = /^(?=.*[A-Za-z])(?=.*[^A-Za-z0-9]).{12,}$/
        if (!strictRegex.test(newPassword)) {
            setError("Password must be at least 12 characters, including one letter and one special character")
            return
        }

        changePassword({ currentPassword, newPassword })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md border border-black shadow-none rounded-xl">
                <CardHeader className="space-y-1 border-b pb-4 mb-4">
                    <CardTitle className="text-xl font-normal text-center">Change Password</CardTitle>
                    <CardDescription className="text-center">
                        You must change your password before continuing.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-0">


                        <div className="space-y-2">
                            <Label htmlFor="current-password" className="font-bold text-base">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                placeholder="Enter current password"
                                className="border border-black rounded-lg h-11"
                                minLength={1} // Just to ensure it's not empty, effectively handled by required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="font-bold text-base">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="pr-10 border border-black rounded-lg h-11"
                                    minLength={12}
                                    maxLength={64}
                                    pattern="^(?=.*[A-Za-z])(?=.*[^A-Za-z0-9]).{12,}$"
                                    title="Password must be at least 12 characters, including one letter and one special character"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Must be at least 12 characters, including 1 letter and 1 special character.
                            </p>
                        </div>

                        <div className="space-y-2 pb-5">
                            <Label htmlFor="confirm-password" className="font-bold text-base">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="border border-black rounded-lg h-11"
                                minLength={12}
                            />
                            {confirmPassword.length > 0 && (
                                <p className={`text-xs flex items-center gap-1 mt-1 ${newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                                    {newPassword === confirmPassword ? (
                                        <><CheckCircle2 size={12} /> Passwords match</>
                                    ) : (
                                        <><XCircle size={12} /> Passwords do not match</>
                                    )}
                                </p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-medium rounded-lg text-white"
                            disabled={isPending}
                        >
                            {isPending ? "Updating..." : "Update Password"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
