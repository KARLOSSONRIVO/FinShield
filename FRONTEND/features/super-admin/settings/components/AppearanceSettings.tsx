"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function AppearanceSettings() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    const isDark = theme === "dark"

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <Moon className="h-5 w-5" />
                    <Switch
                        checked={!isDark} // Checked is 'Light' (Sun side) based on screenshot intuition (Green switch usually means 'active' or 'right' side)
                        // Wait, usually Switch toggle: Left=Off/False, Right=On/True.
                        // Screenshot: Moon - Switch(Green/Right) - Sun.
                        // If Switch is Right (Green), it usually means 'On'.
                        // If Sun is on the Right, then 'On' should be Light mode.
                        onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
                        className="data-[state=checked]:bg-emerald-600"
                    />
                    <Sun className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    )
}
