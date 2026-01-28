"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppearanceSettings } from "./components/AppearanceSettings"
import { User, Shield } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>

            <Tabs defaultValue="appearance" className="space-y-4">
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
                    <div className="p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                        <h4 className="font-semibold mb-2">Profile Information</h4>
                        <p className="text-sm text-muted-foreground">Profile settings coming soon...</p>
                    </div>
                </TabsContent>
                <TabsContent value="appearance" className="space-y-4">
                    <AppearanceSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
