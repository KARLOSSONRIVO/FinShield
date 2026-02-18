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
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const regulatorLinks: NavLink[] = [
    { href: "/admin/regulator", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/regulator/invoices", label: "Invoices", icon: FileText },
    { href: "/admin/regulator/blockchain", label: "Ledger", icon: Link2 },
    { href: "/admin/regulator/audit-logs", label: "Audit Logs", icon: ScrollText },
]

export default function RegulatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const { user } = useAuth()

    
    const getPageTitle = (path: string) => {
        if (path === "/admin/regulator") return "Regulator Dashboard"
        return "FinShield Regulator"
    }

    const title = getPageTitle(pathname)

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {}
            <AppSidebar
                links={regulatorLinks}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                title="Regulator"
            />

            {}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-300",
                    collapsed ? "ml-20" : "ml-72"
                )}
            >
                {}
                <div className="sticky top-0 z-40">
                    <TopBar
                        title={title}
                        userName={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Regulator User"}
                        organizationName="Regulatory Body"
                        profileLink="/admin/regulator/settings"
                        notifications={[
                            { title: "Action Required", time: "2h ago", message: "Compliance report for Provider 100 is ready." }
                        ]}
                    />
                </div>

                {}
                <main className="flex-1 p-4 md:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    )
}
