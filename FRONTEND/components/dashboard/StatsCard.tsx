import { Card, CardContent } from '@/components/ui/layout/card'
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
    return (
        <Card className={cn("border-2 border-black/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]", className)}>
            <CardContent className="p-6 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start w-full mb-2">
                    <p className="text-sm font-bold text-black">{title}</p>
                    <Icon className={cn("h-8 w-8 text-slate-400 stroke-[1.5]", iconClassName)} />
                </div>

                <div className="mt-auto">
                    <div className="text-4xl font-extrabold tracking-tight text-black mb-1">{value}</div>
                    {description && <p className={cn("text-sm font-bold",
                        title.includes("Verified") ? "text-emerald-500" :
                            title.includes("Flagged") ? "text-red-500" :
                                title.includes("Invoices") ? "text-muted-foreground" :
                                    title.includes("Employees") ? "text-amber-500" :
                                        title.includes("Volume") ? "text-emerald-600" :
                                            "text-slate-500"
                    )}>{description}</p>}
                </div>
            </CardContent>
        </Card>
    )
}
