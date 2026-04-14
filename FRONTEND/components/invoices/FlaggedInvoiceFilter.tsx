"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DateRange } from "react-day-picker"

const MONTHS = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
]

interface FlaggedInvoiceFilterProps {
    search: string
    onSearchChange: (value: string) => void
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null
    onSortChange: (key: string, direction?: 'asc' | 'desc') => void

    statusFilter?: string
    onStatusChange?: (value: string) => void

    dateRange?: DateRange
    onDateRangeChange?: (range: DateRange | undefined) => void

    // Data-driven month/year from the hook
    monthFilter?: string
    yearFilter?: string
    onMonthChange?: (value: string) => void
    onYearChange?: (value: string) => void
    availableYears?: number[]

    hasActiveFilters?: boolean
    onClearFilters?: () => void
}

export function FlaggedInvoiceFilter({
    search,
    onSearchChange,
    sortConfig,
    onSortChange,
    statusFilter,
    onStatusChange,
    dateRange,
    onDateRangeChange,
    monthFilter,
    yearFilter,
    onMonthChange,
    onYearChange,
    availableYears,
    hasActiveFilters: hasActiveFiltersProp,
    onClearFilters,
}: FlaggedInvoiceFilterProps) {
    const [localSearch, setLocalSearch] = useState(search)

    useEffect(() => { setLocalSearch(search) }, [search])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch !== search) onSearchChange(localSearch)
        }, 400)
        return () => clearTimeout(timer)
    }, [localSearch])

    const computedHasActiveFilters =
        (statusFilter !== undefined && statusFilter !== "all") ||
        !!(dateRange?.from || dateRange?.to) ||
        (monthFilter !== undefined && monthFilter !== "all") ||
        (yearFilter !== undefined && yearFilter !== "all") ||
        !!sortConfig

    const hasActiveFilters = hasActiveFiltersProp !== undefined ? hasActiveFiltersProp : computedHasActiveFilters

    return (
        <div className="flex gap-2 mb-4 pt-2">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by invoice number or company..."
                    className="pl-9 bg-white border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base w-full"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                />
            </div>

            {/* Filter & Sort dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant={hasActiveFilters || sortConfig?.key ? "default" : "outline"}
                        className={cn(
                            "gap-2 shrink-0 font-medium px-6 text-base",
                            !(hasActiveFilters || sortConfig?.key) && "bg-white hover:bg-gray-50 text-foreground border-2 border-black/10"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                        Filter & Sort {hasActiveFilters || sortConfig?.key ? "(Active)" : ""}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[340px] max-h-[80vh] overflow-y-auto p-0">
                    {/* Sticky header */}
                    <div className="sticky top-0 bg-background/95 backdrop-blur z-10 p-3 border-b flex items-center justify-between">
                        <span className="font-semibold text-sm">Filter Options</span>
                        <Button
                            variant="ghost" size="sm"
                            onClick={onClearFilters}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground"
                            disabled={!hasActiveFilters && !sortConfig?.key}
                        >
                            Clear All
                        </Button>
                    </div>

                    <div className="p-3 space-y-4">
                        {/* Sort — mutually exclusive with AI Verdict and Review Status */}
                        <div>
                            <DropdownMenuLabel className="px-0 pt-0 pb-2 text-muted-foreground uppercase text-xs tracking-wider">
                                Sort By Date Created
                            </DropdownMenuLabel>
                            <div className="space-y-1">
                                {[
                                    { dir: 'desc' as const, label: "Date Created (New - Old)" },
                                    { dir: 'asc' as const, label: "Date Created (Old - New)" },
                                ].map(({ dir, label }) => (
                                    <DropdownMenuItem
                                        key={dir}
                                        onClick={() => onSortChange("createdAt", dir)}
                                        className={cn(
                                            "cursor-pointer",
                                            sortConfig?.key === "createdAt" && sortConfig?.direction === dir &&
                                            "bg-emerald-50 text-emerald-600 font-medium"
                                        )}
                                    >
                                        {label}
                                        {sortConfig?.key === "createdAt" && sortConfig?.direction === dir}
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        </div>

                        {/* Review Status */}
                        {statusFilter !== undefined && onStatusChange && (
                            <>
                                <DropdownMenuSeparator />
                                <div>
                                    <DropdownMenuLabel className="px-0 pt-0 pb-2 text-muted-foreground uppercase text-xs tracking-wider">
                                        Review Status
                                    </DropdownMenuLabel>
                                    <div className="space-y-1">
                                        {[
                                            { value: "pending", label: "Pending" },
                                            { value: "approved", label: "Approved" },
                                            { value: "rejected", label: "Rejected" },
                                        ].map((opt) => (
                                            <DropdownMenuCheckboxItem
                                                key={opt.value}
                                                checked={statusFilter === opt.value}
                                                onCheckedChange={() =>
                                                    onStatusChange(statusFilter === opt.value ? "all" : opt.value)
                                                }
                                                className="text-sm"
                                            >
                                                {opt.label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Date Range */}
                        {dateRange !== undefined && onDateRangeChange && (
                            <>
                                <DropdownMenuSeparator />
                                <div>
                                    <DropdownMenuLabel className="px-0 pt-0 pb-2 text-muted-foreground uppercase text-xs tracking-wider">
                                        Invoice Date Range
                                    </DropdownMenuLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn("w-full justify-start text-left font-normal truncate text-sm", !dateRange?.from && "text-muted-foreground")}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                                {dateRange?.from ? (
                                                    dateRange.to
                                                        ? `${format(dateRange.from, "LLL dd, y")} – ${format(dateRange.to, "LLL dd, y")}`
                                                        : format(dateRange.from, "LLL dd, y")
                                                ) : "Pick a date range"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange?.from}
                                                selected={dateRange}
                                                onSelect={onDateRangeChange}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    {(dateRange?.from || dateRange?.to) && (
                                        <Button
                                            variant="ghost" size="sm"
                                            onClick={() => onDateRangeChange(undefined)}
                                            className="mt-1 h-7 text-xs text-muted-foreground w-full"
                                        >
                                            <X className="h-3 w-3 mr-1" /> Clear date range
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}

                        <DropdownMenuSeparator />

                        {/* Month / Year filter — calendar-based from real data */}
                        {(onMonthChange || onYearChange) && (
                            <div>
                                <DropdownMenuLabel className="px-0 pt-0 pb-2 text-muted-foreground uppercase text-xs tracking-wider">
                                    Filter by Month / Year
                                </DropdownMenuLabel>
                                <div className="flex gap-2">
                                    {onMonthChange && (
                                        <Select value={monthFilter || "all"} onValueChange={onMonthChange}>
                                            <SelectTrigger className="flex-1 h-9 text-sm">
                                                <SelectValue placeholder="Month" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Months</SelectItem>
                                                {MONTHS.map(m => (
                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    {onYearChange && (
                                        <Select value={yearFilter || "all"} onValueChange={onYearChange}>
                                            <SelectTrigger className="flex-1 h-9 text-sm">
                                                <SelectValue placeholder="Year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Years</SelectItem>
                                                {(availableYears || []).map(y => (
                                                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}