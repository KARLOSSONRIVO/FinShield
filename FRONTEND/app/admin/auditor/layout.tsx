"use client"

import { useState } from "react"
import { AppSidebar, NavLink } from "@/components/layout/AppSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FileText,
    AlertTriangle,
    Link2,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const auditorLinks: NavLink[] = [
    { href: "/admin/auditor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/auditor/invoices", label: "All Invoices", icon: FileText },
    { href: "/admin/auditor/flagged", label: "Flagged Queue", icon: AlertTriangle },
    { href: "/admin/auditor/blockchain", label: "Blockchain Ledger", icon: Link2 },
]

export default function AuditorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const { user } = useAuth()

    // Determine title based on path
    const getPageTitle = (path: string) => {
        if (path === "/admin/auditor") return "Auditor Dashboard"
        if (path.includes("/invoices")) return "Invoice Auditing"
        if (path.includes("/flagged")) return "Flagged Queue"
        if (path.includes("/blockchain")) return "Blockchain Ledger"
        return "FinShield Auditor"
    }

    const title = getPageTitle(pathname)

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Sidebar with fixed positioning */}
            <AppSidebar
                links={auditorLinks}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                title="FinShield"
            />

            {/* Main content wrapper */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 w-full transition-all duration-700 ease-in-out",
                    collapsed ? "md:ml-24" : "md:ml-72"
                )}
            >
                {/* Top Navigation Bar - Sticky */}
                <div className="sticky top-0 z-40">
                    <TopBar
                        title={title}
                        userName={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Auditor User"}
                        organizationName="Auditor Role"
                        profileLink="/admin/auditor/settings"
                        notifications={[
                            { title: "New Assignment", time: "1h ago", message: "You have been assigned to review Company 100." },
                            { title: "New Assignment", time: "2h ago", message: "You have been assigned to review Company 101." }
                        ]}
                        onMenuClick={() => setCollapsed(false)}
                    />
                </div>

                {/* Main Content */}
                <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden p-4 md:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    )
}
