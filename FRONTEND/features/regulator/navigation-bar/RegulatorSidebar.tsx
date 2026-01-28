"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FinShieldLogo } from "@/components/finshield-logo"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    FileText,
    Link2,
    ScrollText,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react"
import { useState } from "react"

const regulatorLinks = [
    { href: "/admin/regulator", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/regulator/invoices", label: "Assigned Invoices", icon: FileText },
    { href: "/admin/regulator/blockchain", label: "Blockchain Ledger", icon: Link2 },
    { href: "/admin/regulator/audit-logs", label: "Audit Logs", icon: ScrollText },
]

export function RegulatorSidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    const pathname = usePathname()

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 text-sidebar-foreground shadow-sm fixed top-0 left-0 z-50",
                collapsed ? "w-20" : "w-72",
            )}
        >
            <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        {/* Shield Icon - Green Box with White Outline */}
                        <div className="flex items-center justify-center bg-emerald-600 rounded-lg h-9 w-9 shadow-sm">
                            {/* Reusing the icon from AuditorSidebar for consistency */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-5 w-5 text-white"
                            >
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            </svg>
                        </div>
                        <span className="font-bold text-xl tracking-tight text-sidebar-foreground">FinShield</span>
                    </div>
                )}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={cn(
                            "p-1.5 rounded-full hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground",
                            collapsed && "mx-auto"
                        )}
                    >
                        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {regulatorLinks.map((link) => {
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                                collapsed && "justify-center px-2",
                            )}
                            title={collapsed ? link.label : undefined}
                        >
                            <link.icon className={cn(
                                "h-5 w-5 shrink-0 transition-colors",
                                isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground group-hover:text-sidebar-foreground"
                            )} strokeWidth={2.5} />
                            {!collapsed && <span className="whitespace-nowrap font-semibold">{link.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-sidebar-border mt-auto">
                <Link href="/">
                    <button className={cn(
                        "flex items-center gap-4 w-full px-4 py-3.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all",
                        collapsed && "justify-center px-2"
                    )}>
                        <LogOut className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                        {!collapsed && <span className="font-semibold">Sign out</span>}
                    </button>
                </Link>
            </div>
        </aside>
    )
}
