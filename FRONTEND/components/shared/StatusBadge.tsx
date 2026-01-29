"use client"

import { cn } from "@/lib/utils"
import { getStatusClassName, getVerdictClassName } from "@/lib/styling"

interface StatusBadgeProps {
    status?: string
    verdict?: string
    className?: string
}

export function StatusBadge({ status, verdict, className }: StatusBadgeProps) {
    let badgeClass = ""
    let label = ""

    if (verdict) {
        badgeClass = getVerdictClassName(verdict)
        label = verdict
    } else if (status) {
        badgeClass = getStatusClassName(status)
        label = status
    }

    if (!label) return null

    return (
        <div className={cn(
            "px-4 py-1.5 rounded-md text-[10px] font-bold inline-block min-w-[80px] uppercase tracking-wider text-center",
            badgeClass,
            className
        )}>
            {label}
        </div>
    )
}
