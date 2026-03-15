"use client"

import { useState } from "react"
import { AppSidebar, NavLink } from "@/components/layout/AppSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FileText,
    Link2,
    ScrollText,
    Shield,
    AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/hooks/global/use-auth"

const regulatorLinks: NavLink[] = [
    { href: "/admin/regulator", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/regulator/invoices", label: "Invoices", icon: FileText },
    { href: "/admin/regulator/flagged", label: "Flagged Invoices", icon: AlertTriangle },
    { href: "/admin/regulator/blockchain", label: "Blockchain Ledger", icon: Link2 },
    { href: "/admin/regulator/policy", label: "Policy", icon: Shield },
    { href: "/admin/regulator/terms", label: "Terms", icon: ScrollText },
]

export default function RegulatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const { user } = useAuth()

    // Determine title based on path
    const getPageTitle = (path: string) => {
        if (path === "/admin/regulator") return "Regulator Dashboard"
        if (path === "/admin/regulator/policy") return "Policy Management"
        if (path === "/admin/regulator/blockchain") return "Blockchain Ledger"
        if (path === "/admin/regulator/invoices") return "Invoice Management"
        if (path === "/admin/regulator/terms") return "Terms Management"
        return "FinShield Regulator"
    }

    const title = getPageTitle(pathname)

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Sidebar with fixed positioning */}
            <AppSidebar
                links={regulatorLinks}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                title="FinShield"
            />

            {/* Main content wrapper */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-700 ease-in-out",
                    collapsed ? "ml-0 md:ml-24" : "ml-0 md:ml-72"
                )}
            >
                {/* Top Navigation Bar - Sticky */}
                <div className="sticky top-0 z-40">
                    <TopBar
                        title={title}
                        userName={user?.username}
                        profileLink="/admin/regulator/settings"
                        notifications={[
                            { title: "Action Required", time: "2h ago", message: "Compliance report for Provider 100 is ready." }
                        ]}
                        onMenuClick={() => setCollapsed(false)}
                    />
                </div>

                {/* Main Content */}
                <main className="flex-1 w-full max-w-[100vw] p-4 md:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    )
}