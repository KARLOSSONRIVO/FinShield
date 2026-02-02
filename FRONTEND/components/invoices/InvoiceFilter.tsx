"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, ChevronUp, ChevronDown } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { InvoiceStatusFilter, SortConfig } from "@/hooks/invoices/use-auditor-invoices"
import { Invoice } from "@/lib/types"

interface InvoiceFilterProps {
    search: string
    onSearchChange: (value: string) => void
    statusFilter: InvoiceStatusFilter
    onStatusFilterChange: (value: InvoiceStatusFilter) => void
    sortConfig: SortConfig
    onSortChange: (key: keyof Invoice) => void
}

export function InvoiceFilter({
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    sortConfig,
    onSortChange
}: InvoiceFilterProps) {

    // Helper for Sort selection
    const SortItem = ({ label, sortKey, direction }: { label: string, sortKey: keyof Invoice, direction?: "asc" | "desc" }) => {
        const isActive = sortConfig?.key === sortKey && (!direction || sortConfig.direction === direction)

        return (
            <button
                onClick={() => onSortChange(sortKey)}
                className={cn(
                    "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                    isActive && "text-emerald-600 font-medium bg-emerald-50"
                )}
            >
                {label}
                {isActive && (sortConfig?.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </button>
        )
    }

    // Helper for Filter selection
    const FilterItem = ({ label, value }: { label: string, value: InvoiceStatusFilter }) => {
        const isActive = statusFilter === value
        return (
            <button
                onClick={() => onStatusFilterChange(value)}
                className={cn(
                    "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                    isActive && "text-emerald-600 font-medium bg-emerald-50"
                )}
            >
                {label}
                {isActive && <div className="h-2 w-2 rounded-full bg-emerald-600" />}
            </button>
        )
    }

    return (
        <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search Invoices..."
                    className="pl-9 bg-white border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base w-full"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
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
                        {/* Status Sections */}
                        <div className="px-3 py-2 text-sm font-medium text-black">Filter By Status</div>
                        <div className="px-1">
                            <FilterItem label="All Invoices" value="all" />
                            <FilterItem label="Pending" value="pending" />
                            <FilterItem label="Verified" value="verified" />
                            <FilterItem label="Flagged" value="flagged" />
                            <FilterItem label="Fraudulent" value="fraudulent" />
                        </div>

                        <Separator className="my-2" />

                        {/* Sort Sections */}
                        <div className="px-3 py-2 text-sm font-medium text-black">Sort By Date</div>
                        <div className="px-1">
                            <SortItem label="Invoice Date" sortKey="invoiceDate" />
                        </div>

                        <Separator className="my-2" />

                        <div className="px-3 py-2 text-sm font-medium text-black">Sort By Amount</div>
                        <div className="px-1">
                            <SortItem label="Total Amount" sortKey="totals_total" />
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
