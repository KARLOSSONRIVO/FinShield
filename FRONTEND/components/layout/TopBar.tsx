"use client"

import { useState } from "react"
import {
    Bell,
    User,
    Wallet,
    ChevronUp,
    LogOut,
    Settings,
    Menu,
    AlertTriangle,
    Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
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
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

import { useAuth } from "@/hooks/global/use-auth"
import { PolicyViewDialog } from "@/components/policy/PolicyViewDialog"

export interface NotificationItem {
    title: string
    time: string
    message: string
}

interface TopBarProps {
    title: string;
    organizationName?: string;
    userName?: string;
    notifications?: NotificationItem[];
    profileLink?: string;
    onMenuClick?: () => void;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
    { title: "System Update", time: "1h ago", message: "System maintenance scheduled for tonight." }
]

const formatRole = (role?: string) => {
    if (!role) return "User"
    return role
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

export function TopBar({
    title,
    organizationName,
    userName,
    notifications = DEFAULT_NOTIFICATIONS,
    profileLink = "/settings",
    onMenuClick
}: TopBarProps) {
    const { user, logout } = useAuth()
    const [showLogoutDialog, setShowLogoutDialog] = useState(false)
    const [showPolicyDialog, setShowPolicyDialog] = useState(false)

    const displayUserName = userName || user?.username || "User"
    const displayRole = organizationName || formatRole(user?.role)

    // Roles that can view the Policy menu item
    const canViewPolicies = user?.role && ["AUDITOR", "COMPANY_MANAGER", "COMPANY_USER"].includes(user.role)

    return (
        <header className="h-20 border-b border-border bg-background px-4 md:px-6 flex items-center justify-between">
            {/* Left Side: Mobile Menu + Page Title */}
            <div className="flex items-center gap-3">
                {onMenuClick && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-foreground hover:bg-muted shrink-0"
                        onClick={onMenuClick}
                        suppressHydrationWarning
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                )}
                <h1 className="text-xl font-bold text-foreground truncate">{title}</h1>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Notifications Popover */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" suppressHydrationWarning>
                            <Bell className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b border-border">
                            <h4 className="font-semibold">Notifications</h4>
                        </div>
                        <div className="p-0">
                            {notifications.length > 0 ? notifications.map((note, i) => (
                                <div key={i} className="p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm">{note.title}</span>
                                        <span className="text-xs text-muted-foreground">{note.time}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {note.message}
                                    </p>
                                </div>
                            )) : (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    No new notifications
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="group pl-2 pr-4 py-2 h-auto flex items-center gap-3 hover:bg-muted/50 rounded-full border border-border data-[state=open]:bg-muted/50" suppressHydrationWarning>
                            <div className="relative bg-primary/20 h-8 w-8 rounded-full flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                                {!user?.mfaEnabled && (
                                    <AlertTriangle className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-amber-400" strokeWidth={2.5} />
                                )}
                            </div>
                            <div className="flex flex-col items-start justify-center h-8 text-sm">
                                {userName || user?.username ? (
                                    <span className="font-semibold leading-none">{displayUserName}</span>
                                ) : (
                                    <Skeleton className="h-4 w-24 mb-1.5" />
                                )}
                                {organizationName || user?.role ? (
                                    <span className="text-xs text-muted-foreground leading-none mt-0.5">{displayRole}</span>
                                ) : (
                                    <Skeleton className="h-3 w-16" />
                                )}
                            </div>
                            <ChevronUp className="h-3 w-3 text-muted-foreground ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-sidebar text-sidebar-foreground border-sidebar-border">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={profileLink}>
                            <DropdownMenuItem className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span className="font-medium">Profile</span>
                                {!user?.mfaEnabled && (
                                    <AlertTriangle className="ml-auto h-4 w-4 text-amber-400" />
                                )}
                            </DropdownMenuItem>
                        </Link>
                        {user?.role === 'SUPER_ADMIN' && (
                            <DropdownMenuItem className="cursor-pointer">
                                <Wallet className="mr-2 h-4 w-4" />
                                <span className="font-medium">Wallet</span>
                            </DropdownMenuItem>
                        )}
                        {/* Policy menu item for AUDITOR, COMPANY_MANAGER, COMPANY_USER */}
                        {canViewPolicies && (
                            <DropdownMenuItem
                                className="cursor-pointer"
                                onSelect={(e) => {
                                    e.preventDefault()
                                    setShowPolicyDialog(true)
                                }}
                            >
                                <Shield className="mr-2 h-4 w-4" />
                                <span className="font-medium">Policy</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-sidebar-border" />
                        <DropdownMenuItem
                            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                            onSelect={(e) => {
                                e.preventDefault()
                                setShowLogoutDialog(true)
                            }}
                        >
                            <LogOut className="mr-2 h-4 w-4 text-red-500" />
                            <span className="font-medium">Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Logout Confirmation Dialog */}
                <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                            <AlertDialogDescription>
                                You will be directed back to the login screen and will need to provide your credentials to access the system again.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => logout()} className="bg-red-600 hover:bg-red-700 text-white">
                                Log out
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Policy View Dialog */}
                <PolicyViewDialog
                    open={showPolicyDialog}
                    onOpenChange={setShowPolicyDialog}
                />
            </div>
        </header>
    )
}