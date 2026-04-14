"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MFASettings } from "./MFASettings"
import { AppearanceSettings } from "./AppearanceSettings"
import { User, Shield, Lock, KeyRound } from "lucide-react"
import { useAuth } from "@/hooks/global/use-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChangePasswordDialog } from "./ChangePasswordDialog"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

export function SettingsPage() {
    const { user } = useAuth()
    const [changePasswordOpen, setChangePasswordOpen] = useState(false)
    const [activeTab, setActiveTab] = useState("profile")

    const formatRole = (role: string) => {
        return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold">Settings</h3>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 w-full">
                <div className="flex w-full">
                    <TabsList className="relative bg-muted p-1 rounded-lg inline-flex overflow-x-auto no-scrollbar">
                        {/* Animated Background Indicator */}
                        <div className="absolute inset-0 p-1 pointer-events-none">
                            <motion.div
                                className="h-full bg-background dark:bg-zinc-800 rounded-[5px] shadow-sm border border-black/5 dark:border-white/10"
                                layoutId="settingsTabIndicator"
                                initial={false}
                                animate={{
                                    x: activeTab === 'profile' ? 0 : '100%',
                                    width: '50%'
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        </div>

                        <TabsTrigger value="profile" className="gap-2 w-32 relative z-10 px-6 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0">
                            <User className="h-4 w-4" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger value="appearance" className="gap-2 w-36 relative z-10 px-6 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none focus-visible:ring-0">
                            <Shield className="h-4 w-4" />
                            Appearance
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="profile" className="w-full focus-visible:outline-none focus-visible:ring-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full"
                    >
                        {/* Profile Information Card */}
                        <div className="p-4 sm:p-6 border rounded-xl bg-card text-card-foreground shadow-sm space-y-6 w-full overflow-hidden">
                            <div>
                                <h4 className="font-semibold text-lg">Profile Information</h4>
                                <p className="text-sm text-muted-foreground">View your account details</p>
                            </div>

                            <div className="grid gap-4 w-full sm:max-w-xl">
                                <div className="grid gap-2">
                                    <Label>Username</Label>
                                    {user?.username ? (
                                        <Input
                                            value={user.username}
                                            readOnly
                                            className="bg-muted cursor-default focus-visible:ring-0 select-none"
                                        />
                                    ) : (
                                        <Skeleton className="h-10 w-full" />
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    {user?.email ? (
                                        <Input
                                            value={user.email}
                                            readOnly
                                            className="bg-muted cursor-default focus-visible:ring-0 select-none"
                                        />
                                    ) : (
                                        <Skeleton className="h-10 w-full" />
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label>Role</Label>
                                    {user?.role ? (
                                        <Input
                                            value={formatRole(user.role)}
                                            readOnly
                                            className="bg-muted cursor-default focus-visible:ring-0 select-none"
                                        />
                                    ) : (
                                        <Skeleton className="h-10 w-full" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Authentication Card (MFA) */}
                        <MFASettings />

                        {/* Change Password Card */}
                        <div className="p-4 sm:p-6 border rounded-xl bg-card text-card-foreground shadow-sm space-y-6 w-full overflow-hidden">
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
                    </motion.div>
                </TabsContent>

                <TabsContent value="appearance" className="w-full focus-visible:outline-none focus-visible:ring-0">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-2xl w-full"
                    >
                        <AppearanceSettings />
                    </motion.div>
                </TabsContent>
            </Tabs>

            <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
        </div >
    )
}
