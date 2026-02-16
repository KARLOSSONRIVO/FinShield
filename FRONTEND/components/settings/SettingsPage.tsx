"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppearanceSettings } from "./AppearanceSettings"
import { User, Shield, Lock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChangePasswordDialog } from "./ChangePasswordDialog"

export function SettingsPage() {
    const { user } = useAuth()
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)

    const formatRole = (role: string) => {
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="profile" className="gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Appearance
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="profile" className="space-y-4">
                    <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm space-y-6">
                        <div>
                            <h4 className="font-semibold text-lg">Profile Information</h4>
                            <p className="text-sm text-muted-foreground">View your account details</p>
                        </div>

                        <div className="grid gap-4 max-w-xl">
                            <div className="grid gap-2">
                                <Label>Username</Label>
                                <Input
                                    value={user?.username || ""}
                                    readOnly
                                    className="bg-muted cursor-default focus-visible:ring-0 select-none"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input
                                    value={user?.email || ""}
                                    readOnly
                                    className="bg-muted cursor-default focus-visible:ring-0 select-none"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <Input
                                    value={user?.role ? formatRole(user.role) : ""}
                                    readOnly
                                    className="bg-muted cursor-default focus-visible:ring-0 select-none"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Password</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="password"
                                        value="********"
                                        readOnly
                                        className="bg-muted cursor-default focus-visible:ring-0 select-none"
                                    />
                                    <Button
                                        onClick={() => setChangePasswordOpen(true)}
                                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Lock className="h-4 w-4" />
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="appearance" className="space-y-4">
                    <AppearanceSettings />
                </TabsContent>
            </Tabs>

            <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
        </div>
    )
}
