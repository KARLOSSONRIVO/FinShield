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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { termsService, Terms } from '@/services/terms.service'

interface TermsAcceptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onAccept: () => void
    onCancel: () => void
}

export function TermsAcceptDialog({
    open,
    onOpenChange,
    onAccept,
    onCancel
}: TermsAcceptDialogProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['terms', 'all'],
        queryFn: async () => {
            const response = await termsService.getAllTerms()
            return response.data || []
        },
        enabled: open,
    })

    const terms = data || []
    const scrollRef = useRef<HTMLDivElement>(null)
    const termsRefs = useRef<Map<string, HTMLDivElement>>(new Map())
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
    const [accepted, setAccepted] = useState(false)
    const [selectedTermsId, setSelectedTermsId] = useState<string | null>(null)

    useEffect(() => {
        const handleScroll = () => {
            if (!scrollRef.current) return
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
            const isBottom = scrollHeight - scrollTop - clientHeight < 10
            setHasScrolledToBottom(isBottom)
        }

        const current = scrollRef.current
        if (current) {
            current.addEventListener('scroll', handleScroll)
            handleScroll()
        }
        return () => current?.removeEventListener('scroll', handleScroll)
    }, [open, isLoading])

    useEffect(() => {
        if (!open) {
            setHasScrolledToBottom(false)
            setAccepted(false)
            setSelectedTermsId(null)
        }
    }, [open])

    const handleClose = () => {
        onCancel()
    }

    const handleContinue = () => {
        if (accepted) onAccept()
    }

    const scrollToTerms = useCallback((termsId: string) => {
        setSelectedTermsId(termsId)
        const element = termsRefs.current.get(termsId)
        if (element && scrollRef.current) {
            const container = scrollRef.current
            const elementTop = element.offsetTop - container.offsetTop
            container.scrollTo({ top: elementTop, behavior: 'smooth' })
        }
    }, [])

    const dialogProps = {
        onPointerDownOutside: (e: Event) => e.preventDefault(),
        onEscapeKeyDown: (e: Event) => e.preventDefault(),
        onInteractOutside: (e: Event) => e.preventDefault(),
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange} {...dialogProps}>
            <DialogContent
                className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 [&>button.absolute]:hidden"
                {...dialogProps}
            >
                <DialogHeader className="px-6 py-4 border-b relative">
                    <DialogTitle className="text-center text-xl font-semibold">
                        Terms and Conditions
                    </DialogTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4"
                        onClick={handleClose}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </DialogHeader>

                <div className="flex flex-1 min-h-0">
                    <div className="w-64 border-r bg-muted/20 overflow-y-auto p-4">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Terms
                        </h3>
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                                <Skeleton className="h-8 w-full" />
                            </div>
                        ) : error ? (
                            <p className="text-sm text-red-500">Failed to load</p>
                        ) : terms.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No terms</p>
                        ) : (
                            <ul className="space-y-1">
                                {terms.map((term) => (
                                    <li key={term.id}>
                                        <button
                                            onClick={() => scrollToTerms(term.id)}
                                            className={cn(
                                                'w-full text-left px-3 py-2 rounded-md text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                                selectedTermsId === term.id
                                                    ? 'bg-emerald-100'
                                                    : 'hover:bg-primary/10'
                                            )}
                                        >
                                            {term.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

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
                                Failed to load terms. Please try again.
                            </p>
                        )}
                        {!isLoading && !error && terms.length === 0 && (
                            <p className="text-muted-foreground text-center">
                                No terms available.
                            </p>
                        )}
                        {!isLoading &&
                            !error &&
                            terms.map((term: Terms) => (
                                <div
                                    key={term.id}
                                    ref={(el) => {
                                        if (el) termsRefs.current.set(term.id, el)
                                        else termsRefs.current.delete(term.id)
                                    }}
                                    className="mb-8 last:mb-0 scroll-mt-4"
                                >
                                    <h3 className="font-semibold text-lg flex items-center justify-between border-b pb-2 mb-3">
                                        <span className="flex items-center gap-2">
                                            <span className="text-primary">•</span>
                                            {term.title}
                                        </span>
                                        <span className="text-sm font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                            v{term.version}
                                        </span>
                                    </h3>
                                    <div className="ml-5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {term.content}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>

                <div className="border-t px-6 py-4 bg-background">
                    <div className="flex items-start space-x-2 mb-4">
                        <Checkbox
                            id="accept-terms"
                            checked={accepted}
                            onCheckedChange={(checked) => setAccepted(checked === true)}
                            disabled={!hasScrolledToBottom}
                        />
                        <Label
                            htmlFor="accept-terms"
                            className={cn(
                                'text-sm leading-tight',
                                !hasScrolledToBottom && 'text-muted-foreground'
                            )}
                        >
                            I have read and accept the Terms & Conditions
                            {!hasScrolledToBottom && (
                                <span className="block text-xs text-amber-600">
                                    (Please scroll to the bottom to enable)
                                </span>
                            )}
                        </Label>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={!accepted}
                            onClick={handleContinue}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}