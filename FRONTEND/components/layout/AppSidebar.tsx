"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/hooks/global/use-auth"

export interface NavLink {
    href: string
    label: string
    icon: LucideIcon
}

interface AppSidebarProps {
    links: NavLink[]
    collapsed: boolean
    setCollapsed: (collapsed: boolean) => void
    title?: string
}

export function AppSidebar({ links, collapsed, setCollapsed, title = "FinShield" }: AppSidebarProps) {
    const pathname = usePathname()
    const { logout } = useAuth()
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)

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
                <div className="h-20 flex shrink-0 items-center pl-[20px] pr-4 border-b border-border relative">
                    <div className={cn(
                        "flex items-center transition-opacity duration-700 ease-in-out",
                        collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
                    )}>
                        <img
                            src="/assets/image/FinShield.svg"
                            alt="FinShield Logo"
                            className="h-9 w-auto object-contain"
                        />
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

                {/* Footer / Sign Out (Commented out per user request) */}
                {/* 
                <div className="p-4 border-t border-border mt-auto">
                    <button
                        onClick={() => setShowLogoutDialog(true)}
                        className={cn(
                            "flex items-center gap-4 w-full pl-[22px] pr-4 py-3.5 rounded-xl text-sm font-medium text-sidebar-foreground hover:bg-red-500/10 hover:text-red-500 transition-all duration-700 ease-in-out cursor-pointer whitespace-nowrap overflow-hidden relative justify-start group",
                        )}
                    >
                        <div className="flex items-center justify-center shrink-0 w-5">
                            <LogOut className="h-5 w-5 shrink-0 transition-colors duration-700 ease-in-out group-hover:text-red-500" strokeWidth={2.5} />
                        </div>
                        <span className={cn(
                            "font-semibold transition-all duration-700 ease-in-out",
                            collapsed ? "opacity-0" : "opacity-100"
                        )}>
                            Sign out
                        </span>
                    </button>
                </div>
                */}
            </aside>

            {/* Confirm Sign Out Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sign out?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will be logged out of your account and redirected to the login page.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => logout()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Sign out
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

