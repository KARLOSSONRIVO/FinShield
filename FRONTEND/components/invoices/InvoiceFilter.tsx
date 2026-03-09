"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface InvoiceFilterProps {
    search: string
    onSearchChange: (value: string) => void
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null
    onSortChange: (key: string, direction?: 'asc' | 'desc') => void
}

export function InvoiceFilter({
    search,
    onSearchChange,
    sortConfig,
    onSortChange
}: InvoiceFilterProps) {
    const [localSearch, setLocalSearch] = useState(search)

    // Sync local state when URL search changes externally (e.g. page load)
    useEffect(() => { setLocalSearch(search) }, [search])

    // Debounce: push URL update 500ms after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== search) onSearchChange(localSearch)
        }, 500)
        return () => clearTimeout(timer)
    }, [localSearch, search, onSearchChange])

    return (
        <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by invoice number..."
                    className="pl-9 bg-white border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base w-full"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2 shrink-0 bg-white hover:bg-gray-50 text-foreground font-medium px-6 border-2 border-black/10 text-base">
                        <Filter className="h-4 w-4" />
                        Filter & Sort
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                    <div className="py-2">
                        <div className="px-3 py-2 text-sm font-medium text-foreground border-b">Sort By</div>
                        <div className="px-1 mt-1">
                            <button
                                onClick={() => onSortChange('createdAt', 'desc')}
                                className={cn(
                                    "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors",
                                    sortConfig?.key === "createdAt" && sortConfig?.direction === 'desc' && "text-emerald-600 font-medium bg-emerald-50"
                                )}
                            >
                                Date Created (New - Old)
                            </button>
                            <button
                                onClick={() => onSortChange('createdAt', 'asc')}
                                className={cn(
                                    "w-full text-left px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors mt-1",
                                    sortConfig?.key === "createdAt" && sortConfig?.direction === 'asc' && "text-emerald-600 font-medium bg-emerald-50"
                                )}
                            >
                                Date Created (Old - New)
                            </button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}