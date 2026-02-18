"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/layout/tabs'
import { MFASettings } from "./MFASettings"
import { AppearanceSettings } from "./AppearanceSettings"
import { User, Shield, Lock, KeyRound } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
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

                <TabsContent value="profile" className="space-y-6">
                    {}
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
                        </div>
                    </div>

                    {}
                    <MFASettings />

                    {}
                    <div className="p-6 border rounded-xl bg-card text-card-foreground shadow-sm space-y-6">
                        <div>
                            <h4 className="font-semibold text-lg flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-emerald-500" />
                                Password Management
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Regularly update your password to keep your account secure.
                            </p>
                        </div>
                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                            <div>
                                <p className="font-medium text-sm">Change Password</p>
                                <p className="text-xs text-muted-foreground">
                                    Update your password to a new one.
                                </p>
                            </div>
                            <Button
                                onClick={() => setChangePasswordOpen(true)}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                size="sm"
                            >
                                <Lock className="h-4 w-4" />
                                Update Password
                            </Button>
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
