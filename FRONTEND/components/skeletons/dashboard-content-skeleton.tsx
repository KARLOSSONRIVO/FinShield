import { Skeleton } from "@/components/ui/skeleton"

export function DashboardContentSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Text */}
            <div className="space-y-2 mb-6">
                <Skeleton className="h-8 w-64 bg-muted/60" />
                <Skeleton className="h-4 w-48 bg-muted/60" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl bg-card text-card-foreground border-2 border-black/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] p-6 h-[140px] flex flex-col justify-between">
                        <div className="flex justify-between items-start w-full mb-2">
                            <Skeleton className="h-4 w-24 bg-muted/60" />
                            <Skeleton className="h-8 w-8 rounded-md bg-muted/60" />
                        </div>
                        <div className="mt-auto">
                            <Skeleton className="h-10 w-16 mb-2 bg-muted/60" />
                            <Skeleton className="h-4 w-32 bg-muted/60" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Split: Recent Invoices (Left) & Recent Activity (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[400px]">
                {/* Recent Invoices - Takes up 2 columns */}
                <div className="lg:col-span-2 rounded-xl bg-card text-card-foreground border-2 border-black/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
                    <div className="p-6 flex flex-col space-y-1.5">
                        <Skeleton className="h-6 w-32 bg-muted/60" />
                        <Skeleton className="h-4 w-48 bg-muted/60" />
                    </div>
                    <div className="p-6 pt-0 space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-[72px] w-full rounded-md bg-muted/60" />
                        ))}
                    </div>
                </div>

                {/* Recent Activity - Takes up 1 column */}
                <div className="lg:col-span-1 rounded-xl bg-card text-card-foreground border-2 border-black/5 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
                    <div className="p-6 flex flex-col space-y-1.5">
                        <Skeleton className="h-6 w-32 bg-muted/60" />
                        <Skeleton className="h-4 w-48 bg-muted/60" />
                    </div>
                    <div className="p-6 pt-0 space-y-6 mt-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-[25px_1fr] items-start">
                                <Skeleton className="h-3 w-3 translate-y-1 rounded-full bg-muted/60" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full bg-muted/60" />
                                    <Skeleton className="h-3 w-24 bg-muted/60" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
