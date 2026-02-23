"use client"

import Link from "next/link"
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
    LogOut,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    Shield,
    LucideIcon
} from "lucide-react"

export interface NavLink {
    href: string
    label: string
    icon: LucideIcon
}

interface AppSidebarProps {
    links: NavLink[]
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
    title?: string // Optional role title if needed
}

export function AppSidebar({ links, collapsed, setCollapsed, title = "FinShield" }: AppSidebarProps) {
    const pathname = usePathname()

    return (
        <>
            {/* Mobile Overlay */}
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[20] md:hidden"
                    onClick={() => setCollapsed(true)}
                    aria-hidden="true"
                />
            )}

            <aside
                className={cn(
                    "flex flex-col h-screen fixed inset-y-0 left-0 z-[30] bg-sidebar border-r border-border transition-all duration-700 ease-in-out text-sidebar-foreground shadow-sm overflow-hidden",
                    collapsed ? "-translate-x-full md:translate-x-0 md:w-24" : "translate-x-0 w-[280px] md:w-72",
                )}
            >
                {/* Header / Logo Area */}
                <div className="h-20 flex shrink-0 items-center pl-[30px] pr-4 border-b border-border relative">
                    <div className={cn(
                        "flex items-center transition-opacity duration-700 ease-in-out",
                        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}>
                        <div className="flex shrink-0 items-center justify-center bg-emerald-600 rounded-lg h-9 w-9 shadow-sm">
                            <Shield className="h-5 w-5 text-white" fill="none" strokeWidth={2.5} />
                        </div>
                        <div className="overflow-hidden whitespace-nowrap ml-3">
                            <span className="font-bold text-xl tracking-tight text-sidebar-foreground truncate">{title}</span>
                        </div>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1 shrink-0 absolute transition-all duration-700 ease-in-out",
                        collapsed ? "right-8" : "right-4"
                    )}>
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            suppressHydrationWarning
                            className="p-1.5 rounded-full hover:bg-sidebar-accent/50 transition-colors text-sidebar-foreground"
                        >
                            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    {links.map((link) => {
                        const isActive = pathname === link.href

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-4 pl-[22px] pr-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-700 ease-in-out group whitespace-nowrap overflow-hidden relative justify-start",
                                    isActive
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                        : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                                )}
                                title={collapsed ? link.label : undefined}
                            >
                                <div className="flex items-center justify-center shrink-0 w-5">
                                    <link.icon
                                        className={cn(
                                            "h-5 w-5 transition-colors duration-700 ease-in-out shrink-0",
                                            isActive ? "text-sidebar-accent-foreground" : "text-sidebar-foreground group-hover:text-sidebar-foreground",
                                        )}
                                        strokeWidth={2.5}
                                    />
                                </div>
                                <span className={cn(
                                    "font-semibold transition-all duration-700 ease-in-out",
                                    collapsed ? "opacity-0" : "opacity-100"
                                )}>
                                    {link.label}
                                </span>
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / Sign Out */}
                <div className="p-4 border-t border-border mt-auto">
                    <Link href="/">
                        <div className={cn(
                            "flex items-center gap-4 w-full pl-[22px] pr-4 py-3.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-700 ease-in-out cursor-pointer whitespace-nowrap overflow-hidden relative justify-start",
                        )}>
                            <div className="flex items-center justify-center shrink-0 w-5">
                                <LogOut className="h-5 w-5 shrink-0 transition-colors duration-700 ease-in-out text-sidebar-foreground" strokeWidth={2.5} />
                            </div>
                            <span className={cn(
                                "font-semibold transition-all duration-700 ease-in-out",
                                collapsed ? "opacity-0" : "opacity-100"
                            )}>
                                Sign out
                            </span>
                        </div>
                    </Link>
                </div>
            </aside>
        </>
    )
}
