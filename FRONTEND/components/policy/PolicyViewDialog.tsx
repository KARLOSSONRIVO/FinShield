'use client'

import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { policyService, Policy } from '@/services/policy.service'

interface PolicyViewDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PolicyViewDialog({
    open,
    onOpenChange,
}: PolicyViewDialogProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['policies', 'view', 'all'],
        queryFn: async () => {
            const response = await policyService.getAllPolicies({ limit: 100 })
            return response.data || []
        },
        enabled: open,
    })

    const policies = data || []
    const scrollRef = useRef<HTMLDivElement>(null)
    const policyRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)

    useEffect(() => {
        if (!open) setSelectedPolicyId(null)
    }, [open])

    const scrollToPolicy = useCallback((policyId: string) => {
        setSelectedPolicyId(policyId)
        const element = policyRefs.current.get(policyId)
        if (element && scrollRef.current) {
            const container = scrollRef.current
            const elementTop = element.offsetTop - container.offsetTop
            container.scrollTo({ top: elementTop, behavior: 'smooth' })
        }
    }, [])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 [&>button.absolute]:hidden">
                <DialogHeader className="px-6 py-4 border-b relative">
                    <DialogTitle className="text-center text-xl font-semibold">
                        Policies
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="flex flex-1 min-h-0">
                    {/* Sidebar */}
                    <div className="w-64 border-r bg-muted/20 overflow-y-auto p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Policies
                        </h3>
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : error ? (
                            <p className="text-sm text-red-500">Failed to load</p>
                        ) : policies.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No policies</p>
                        ) : (
                            <ul className="space-y-1">
                                {policies.map((policy) => (
                                    <li key={policy.id}>
                                        <button
                                            onClick={() => scrollToPolicy(policy.id)}
                                            className={cn(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                selectedPolicyId === policy.id
                                                    ? 'bg-emerald-100'
                                                    : 'hover:bg-primary/10'
                                            )}
                                        >
                                            {policy.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Content */}
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-6"
                    >
                        {isLoading && (
                            <div className="space-y-4">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-6 w-2/3" />
                                <Skeleton className="h-16 w-full" />
                            </div>
                        )}
                        {error && (
                            <p className="text-red-500 text-center">
                                Failed to load policies. Please try again.
                            </p>
                        )}
                        {!isLoading && !error && policies.length === 0 && (
                            <p className="text-muted-foreground text-center">
                                No policies available.
                            </p>
                        )}
                        {!isLoading &&
                            !error &&
                            policies.map((policy: Policy) => (
                                <div
                                    key={policy.id}
                                    ref={(el) => {
                                        if (el) policyRefs.current.set(policy.id, el)
                                        else policyRefs.current.delete(policy.id)
                                    }}
                                    className="mb-8 last:mb-0 scroll-mt-4"
                                >
                                    <h3 className="font-semibold text-lg flex items-center justify-between border-b pb-2 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="text-primary">•</span>
                                            {policy.title}
                                        </span>
                                        <span className="text-sm font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                            v{policy.version}
                                        </span>
                                    </h3>
                                    <div className="ml-5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {policy.content}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}