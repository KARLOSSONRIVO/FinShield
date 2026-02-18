"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Switch } from '@/components/ui/forms/switch'
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card'

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
                        checked={!isDark}
                        onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
                        className="data-[state=checked]:bg-emerald-600"
                    />
                    <Sun className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    )
}
