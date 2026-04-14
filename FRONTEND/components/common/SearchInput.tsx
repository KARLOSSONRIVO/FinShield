"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    debounceMs?: number
}

/**
 * A search input that debounces before calling `onChange`.
 * Prevents URL pushes / re-renders on every keystroke while keeping the
 * input controlled and cursor-stable.
 */
export function SearchInput({
    value,
    onChange,
    placeholder = "Search...",
    className = "",
    debounceMs = 500,
}: SearchInputProps) {
    const [local, setLocal] = useState(value)

    // Sync if URL was cleared externally (e.g. navigating back)
    useEffect(() => { setLocal(value) }, [value])

    // Only push upstream after the user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            if (local !== value) onChange(local)
        }, debounceMs)
        return () => clearTimeout(timer)
    }, [local]) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className={`relative flex-1 ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder={placeholder}
                className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base w-full"
                value={local}
                onChange={(e) => setLocal(e.target.value)}
            />
        </div>
    )
}
