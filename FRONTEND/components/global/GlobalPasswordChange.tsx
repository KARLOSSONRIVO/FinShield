"use client"

import { usePathname } from "next/navigation"
import { useAuthContext } from "@/components/providers/auth-provider"
import { MustChangePasswordDialog } from "@/components/global/MustChangePasswordDialog"

export function GlobalPasswordChange() {
    const pathname = usePathname()
    const { user } = useAuthContext()

    // Do not show on the login page or any auth-related pages
    if (pathname === "/login" || pathname?.includes("/forgot-password")) {
        return null
    }

    // Only render when the user must change password
    if (!user || !(user as any).mustChangePassword) return null

    return <MustChangePasswordDialog />
}