import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    className?: string
    iconClassName?: string
}

export function StatsCard({ title, value, description, icon: Icon, className, iconClassName }: StatsCardProps) {
    const isEmerald = title.toLowerCase().includes("verified") || title.toLowerCase().includes("volume") || iconClassName?.includes("emerald") || className?.includes("emerald") || title.toLowerCase().includes("clean")
    const isRed = title.toLowerCase().includes("flagged") || title.toLowerCase().includes("fraud") || title.toLowerCase().includes("alert") || iconClassName?.includes("red") || className?.includes("red") || title.toLowerCase().includes("rejected")
    const isAmber = title.toLowerCase().includes("employee") || title.toLowerCase().includes("pending") || iconClassName?.includes("amber") || className?.includes("amber")

    let colorClass = "text-[#3b5998]"
    let bgGlow = "bg-[#3b5998]"

    if (isEmerald) { colorClass = "text-emerald-500"; bgGlow = "bg-emerald-500" }
    if (isRed) { colorClass = "text-red-500"; bgGlow = "bg-red-500" }
    if (isAmber) { colorClass = "text-amber-500"; bgGlow = "bg-amber-500" }

    return (
        <div className={cn("group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-black/10 dark:hover:border-white/10", className)}>
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-30 group-hover:scale-150 ${bgGlow}`} />
            <div className="relative z-10 flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
                    <h3 className="text-4xl font-black tracking-tight text-foreground">{value}</h3>
                    <p className="text-sm text-muted-foreground/80">{description}</p>
                </div>
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-card shadow-sm border border-border/50 ring-1 ring-black/5 dark:ring-white/5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorClass}`}>
                    <Icon className="h-7 w-7" />
                </div>
            </div>
        </div>
    )
}
