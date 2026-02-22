"use client"

import { useState } from "react"
import { AppSidebar, NavLink } from "@/components/layout/AppSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FileText,
    Users,
    Upload,
    BarChart3,
    AlertTriangle,
    ScrollText
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const managerLinks: NavLink[] = [
    { href: "/company/manager", label: "Dashboard", icon: LayoutDashboard },
    { href: "/company/manager/upload", label: "Upload Invoice", icon: Upload },
    { href: "/company/manager/employees", label: "Employees", icon: Users },
    { href: "/company/manager/invoices", label: "Company Invoices", icon: FileText },
    { href: "/company/manager/alerts", label: "Alerts", icon: AlertTriangle },
    { href: "/company/manager/reports", label: "Reports", icon: BarChart3 },
]

export default function CompanyManagerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    const { user } = useAuth()

    // Determine title based on path
    const getPageTitle = (path: string) => {
        if (path === "/company/manager") return "Dashboard"
        if (path.includes("/upload")) return "Uploading Invoice"
        if (path.includes("/employees")) return "Employees"
        if (path.includes("/invoices")) return "Company Invoices"
        if (path.includes("/alerts")) return "Alerts"
        if (path.includes("/reports")) return "Reports"
        return "Company Manager"
    }

    const title = getPageTitle(pathname)

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Sidebar with fixed positioning */}
            <AppSidebar
                links={managerLinks}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                title="FinShield"
            />

            {/* Main content wrapper */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-700 ease-in-out",
                    collapsed ? "ml-20" : "ml-72"
                )}
            >
                {/* Top Navigation Bar - Sticky */}
                <div className="sticky top-0 z-40">
                    <TopBar
                        title={title}
                        userName={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Company Manager"}
                        organizationName="Company Manager" // Or fetch org name
                        profileLink="/company/manager/settings"
                        notifications={[
                            { title: "Invoice Flagged", time: "10m ago", message: "INV-004 has been flagged as Fraudulent." },
                            { title: "Review Complete", time: "1h ago", message: "INV-003 verified successfully." }
                        ]}
                    />
                </div>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 space-y-4">
                    {children}
                </main>
            </div>
        </div>
    )
}
