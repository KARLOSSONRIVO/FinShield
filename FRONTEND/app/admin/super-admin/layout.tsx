"use client"

import { useState } from "react"
import { AppSidebar, NavLink } from "@/components/layout/AppSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Building2,
    FileText,
    AlertTriangle,
    Link2,
    ScrollText,
    UserPlus,
    Shield,
} from "lucide-react"
import { useAuth } from "@/hooks/global/use-auth"

const superAdminLinks: NavLink[] = [
    { href: "/admin/super-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/super-admin/organizations", label: "Organizations", icon: Building2 },
    { href: "/admin/super-admin/users", label: "Platform Users", icon: Users },
    { href: "/admin/super-admin/assignments", label: "Auditor Assignments", icon: UserPlus },
    { href: "/admin/super-admin/invoices", label: "All Invoices", icon: FileText },
    { href: "/admin/super-admin/flagged", label: "Flagged Queue", icon: AlertTriangle },
    { href: "/admin/super-admin/blockchain", label: "Blockchain Ledger", icon: Link2 },
    { href: "/admin/super-admin/audit-logs", label: "Audit Logs", icon: ScrollText },
    { href: "/admin/super-admin/policy", label: "Policy", icon: Shield },
    { href: "/admin/super-admin/terms", label: "Terms", icon: ScrollText },
]

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const { user } = useAuth()

    // Determine title based on path
    const getPageTitle = (path: string) => {
        if (path === "/admin/super-admin") return "Dashboard"
        if (path.includes("/organizations")) return "Organization Management"
        if (path.includes("/users")) return "Platform Users"
        if (path.includes("/assignments")) return "Auditor Assignments"
        if (path.includes("/invoices")) return "All Invoices"
        if (path.includes("/flagged")) return "Flagged Queue"
        if (path.includes("/blockchain")) return "Blockchain Ledger"
        if (path.includes("/audit-logs")) return "Audit Logs"
        if (path.includes("/policy")) return "Policy Management"
        if (path.includes("/terms")) return "Terms Management"
        return "FinShield Admin"
    }

    const title = getPageTitle(pathname)

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Sidebar with fixed positioning */}
            <AppSidebar
                links={superAdminLinks}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                title="FinShield"
            />

            {/* Main content wrapper */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 w-full transition-all duration-700 ease-in-out",
                    collapsed ? "ml-0 md:ml-24" : "ml-0 md:ml-72"
                )}
            >
                {/* Top Navigation Bar - Sticky */}
                <div className="sticky top-0 z-40">
                    <TopBar
                        title={title}
                        profileLink="/admin/super-admin/settings"
                        notifications={[
                            { title: "New Fraud Alert", time: "2m ago", message: "Invoice INV-2024-100 tagged for review." },
                            { title: "New Fraud Alert", time: "5m ago", message: "Invoice INV-2024-101 tagged for review." }
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
