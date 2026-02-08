"use client"

import { Bell, User, Wallet, ChevronUp, LogOut, Settings } from "lucide-react"
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
import Link from "next/link"

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
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
    { title: "System Update", time: "1h ago", message: "System maintenance scheduled for tonight." }
]

export function TopBar({
    title,
    organizationName = "Company Position",
    userName = "User",
    notifications = DEFAULT_NOTIFICATIONS,
    profileLink = "/settings"
}: TopBarProps) {
    return (
        <header className="h-20 border-b border-border bg-background px-6 flex items-center justify-between">
            {/* Page Title */}
            <h1 className="text-xl font-bold text-foreground">{title}</h1>

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
                            <div className="bg-primary/20 h-8 w-8 rounded-full flex items-center justify-center text-primary">
                                <User className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-start text-sm">
                                <span className="font-semibold leading-none">{userName}</span>
                                <span className="text-xs text-muted-foreground leading-none mt-1">{organizationName}</span>
                            </div>
                            <ChevronUp className="h-3 w-3 text-muted-foreground ml-2 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href={profileLink}>
                            <DropdownMenuItem className="cursor-pointer">
                                <User className="mr-2 h-4 w-4" />
                                <span className="font-medium">Profile</span>
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="cursor-pointer">
                            <Wallet className="mr-2 h-4 w-4" />
                            <span className="font-medium">Wallet</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Link href="/">
                            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span className="font-medium">Log out</span>
                            </DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header >
    )
}
