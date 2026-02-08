"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { AuthService } from "@/services/auth.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

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
            alert("Password changed successfully! Resuming login...")
            // Re-login logic or just simple redirect? 
            // In a real app we might need to re-login with new credentials or update local state.
            // But since the token is valid, we might just be able to go to /
            // However, the backend might REQUIRE re-login if the token was invalidated or if the "mustChangePassword" claim is inside the token (which it is).
            // So we MUST logout and re-login.
            AuthService.logout()
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            router.push("/login")
        },
        onError: (err: any) => {
            console.error(err)
            setError(err.response?.data?.message || "Failed to change password")
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters")
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
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                                {error}
                            </div>
                        )}

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
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
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
                            />
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
