"use client"

import { usePathname } from "next/navigation"
import { RegulatorSidebar } from "@/features/regulator/navigation-bar/RegulatorSidebar"
import { RegulatorTopBar } from "@/features/regulator/navigation-bar/TopBar"

import { useState } from "react"
import { cn } from "@/lib/utils"

const PATH_TITLES: Record<string, string> = {
    "/admin/regulator": "Dashboard",
    "/admin/regulator/invoices": "Assigned Invoices",
    "/admin/regulator/blockchain": "Blockchain Ledger",
    "/admin/regulator/audit-logs": "Audit Logs",
    "/admin/regulator/settings": "Settings",
}

export default function RegulatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    // Determine title
    let title = "Dashboard"
    if (PATH_TITLES[pathname]) {
        title = PATH_TITLES[pathname]
    } else {
        const sortedKeys = Object.keys(PATH_TITLES).sort((a, b) => b.length - a.length)
        const match = sortedKeys.find(key => pathname.startsWith(key))
        if (match) {
            title = PATH_TITLES[match]
        }
    }

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Sidebar with fixed positioning */}
            <RegulatorSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            {/* Main content wrapper */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-300",
                    collapsed ? "ml-20" : "ml-72"
                )}
            >
                {/* Top Navigation Bar - Sticky */}
                <div className="sticky top-0 z-40">
                    <RegulatorTopBar title={title} />
                </div>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    )
}
