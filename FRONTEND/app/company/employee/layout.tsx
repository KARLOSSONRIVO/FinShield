"use client"

import { useState } from "react"
import { AppSidebar, NavLink } from "@/components/layout/AppSidebar"
import { TopBar } from "@/components/layout/TopBar"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    FileText,
    Upload,
    AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

const employeeLinks: NavLink[] = [
    { href: "/company/employee", label: "Dashboard", icon: LayoutDashboard },
    { href: "/company/employee/upload", label: "Upload Invoice", icon: Upload },
    { href: "/company/employee/invoices", label: "My Invoices", icon: FileText },
    { href: "/company/employee/alerts", label: "Flagged Queue", icon: AlertTriangle },
]

export default function EmployeeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    // Determine title based on path
    const getPageTitle = (path: string) => {
        if (path === "/company/employee") return "Dashboard"
        if (path.includes("/upload")) return "Upload Invoice"
        if (path.includes("/invoices")) return "My Invoices"
        if (path.includes("/alerts")) return "Flagged Queue"
        return "Employee Portal"
    }

    const { user } = useAuth()

    const title = getPageTitle(pathname)

    return (
        <div className="flex min-h-screen bg-muted/20 relative">
            {/* Sidebar with fixed positioning */}
            <AppSidebar
                links={employeeLinks}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                title="FinShield"
            // AppSidebar might not support userRole, checking next step. 
            // Omitting userRole here until verified.
            />

            {/* Main content wrapper */}
            <div
                className={cn(
                    "flex-1 flex flex-col min-w-0 transition-all duration-300",
                    collapsed ? "ml-20" : "ml-72"
                )}
            >
                {/* Top Navigation Bar - Sticky */}
                <div className="sticky top-0 z-40">
                    <TopBar
                        title={title}
                        userName={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "Company Employee"}
                        organizationName="Employee"
                        profileLink="/company/employee/settings"
                        notifications={[
                            { title: "Invoice Verified", time: "2h ago", message: "INV-2024-001 has been verified." },
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
