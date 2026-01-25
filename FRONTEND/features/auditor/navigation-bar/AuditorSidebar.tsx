"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FinShieldLogo } from "@/components/finshield-logo"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    FileText,
    AlertTriangle,
    Link2,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { useState } from "react"

const auditorLinks = [
    { href: "/admin/auditor", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/auditor/invoices", label: "Assigned Invoices", icon: FileText },
    { href: "/admin/auditor/flagged", label: "Flagged Queue", icon: AlertTriangle },
    { href: "/admin/auditor/blockchain", label: "Blockchain Ledger", icon: Link2 },
]

export function AuditorSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                "h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300",
                collapsed ? "w-16" : "w-64",
            )}
        >
            <div
                className={cn(
                    "p-4 border-b border-sidebar-border flex items-center",
                    collapsed ? "justify-center" : "justify-between",
                )}
            >
                {!collapsed && <FinShieldLogo />}
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {!collapsed && (
                <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">Auditor Portal</div>
            )}

            <nav className="flex-1 px-2 py-2 space-y-1">
                {auditorLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                                collapsed && "justify-center",
                            )}
                            title={collapsed ? link.label : undefined}
                        >
                            <link.icon className="h-5 w-5 shrink-0" />
                            {!collapsed && <span>{link.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <Link href="/">
                    <Button variant="ghost" className={cn("w-full", collapsed ? "px-0" : "justify-start")}>
                        <LogOut className="h-5 w-5" />
                        {!collapsed && <span className="ml-2">Logout</span>}
                    </Button>
                </Link>
            </div>
        </aside>
    )
}
