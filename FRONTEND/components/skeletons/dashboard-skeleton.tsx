import { Skeleton } from '@/components/ui/feedback/skeleton'

export function DashboardSkeleton() {
    return (
        <div className="flex h-screen bg-[#F8F9FA]">
            {}
            <div className="hidden lg:flex w-64 flex-col border-r bg-white p-4 space-y-4">
                <div className="flex items-center gap-2 mb-6">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full rounded-lg" />
                    ))}
                </div>
                <div className="mt-auto pt-4 border-t">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="flex-1 flex flex-col overflow-hidden">
                {}
                <div className="h-16 border-b bg-white flex items-center justify-between px-8">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <Skeleton className="h-10 w-10 rounded-full" />
                    </div>
                </div>

                {}
                <div className="flex-1 overflow-auto p-8 space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
