"use client"

import { SuperAdminSidebar } from "@/features/super-admin/navigation-bar/SuperAdminSidebar"
import { TopBar } from "@/features/super-admin/navigation-bar/TopBar"
import { usePathname } from "next/navigation"

const PATH_TITLES: Record<string, string> = {
    "/admin/super-admin": "Dashboard",
    "/admin/super-admin/organizations": "Organizations",
    "/admin/super-admin/users": "Platform Users",
    "/admin/super-admin/assignments": "Auditor Assignments",
    "/admin/super-admin/invoices": "All Invoices",
    "/admin/super-admin/flagged": "Flagged Queue",
    "/admin/super-admin/blockchain": "Blockchain Ledger",
    "/admin/super-admin/audit-logs": "Audit Logs",
}

import { useState } from "react"
import { cn } from "@/lib/utils"

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    // Determine title: Exact match -> Starts with match (for subpages) -> Default
    let title = "Dashboard"
    // Check exact matches first
    if (PATH_TITLES[pathname]) {
        title = PATH_TITLES[pathname]
    } else {
        // Check for sub-paths (longest match wins)
        const sortedKeys = Object.keys(PATH_TITLES).sort((a, b) => b.length - a.length)
        const match = sortedKeys.find(key => pathname.startsWith(key))
        if (match) {
            title = PATH_TITLES[match]
        }
    }

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Sidebar with fixed positioning */}
            <SuperAdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            {/* Main content wrapper with dynamic left margin to accommodate fixed sidebar */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-300",
                    collapsed ? "ml-20" : "ml-72"
                )}
            >
                {/* Top Navigation Bar - Sticky */}
                <div className="sticky top-0 z-40">
                    <TopBar title={title} />
                </div>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    )
}
