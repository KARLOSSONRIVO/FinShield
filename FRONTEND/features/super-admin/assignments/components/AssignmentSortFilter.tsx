"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, ChevronUp, ChevronDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type AssignmentSortKey = "auditorName" | "dueDate"
export type SortDirection = "asc" | "desc"

export type AssignmentSortConfig = {
    key: AssignmentSortKey
    direction: SortDirection
}

interface AssignmentSortFilterProps {
    sortConfig: AssignmentSortConfig | null
    onSortChange: (config: AssignmentSortConfig) => void
}

export function AssignmentSortFilter({ sortConfig, onSortChange }: AssignmentSortFilterProps) {
    const isSortedByAuditor = sortConfig?.key === "auditorName"
    const isSortedByDueDate = sortConfig?.key === "dueDate"

    const handleSort = (key: AssignmentSortKey, direction: SortDirection) => {
        onSortChange({ key, direction })
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 border-2 border-black/10 text-base px-6">
                    <Filter className="h-4 w-4" />
                    Filter & Sort
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="end">
                <div className="py-2">
                    <div className="px-3 py-2 text-sm font-medium text-black">Sort By Auditor</div>
                    <div className="px-1">
                        <button
                            onClick={() => handleSort("auditorName", "asc")}
                            className={cn(
                                "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                                isSortedByAuditor && sortConfig.direction === "asc" && "text-emerald-600 font-medium bg-emerald-50"
                            )}
                        >
                            Name (A-Z)
                            {isSortedByAuditor && sortConfig.direction === "asc" && <ChevronUp className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => handleSort("auditorName", "desc")}
                            className={cn(
                                "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                                isSortedByAuditor && sortConfig.direction === "desc" && "text-emerald-600 font-medium bg-emerald-50"
                            )}
                        >
                            Name (Z-A)
                            {isSortedByAuditor && sortConfig.direction === "desc" && <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>

                    <Separator className="my-2" />

                    <div className="px-3 py-2 text-sm font-medium text-black">Sort By Due Date</div>
                    <div className="px-1">
                        <button
                            onClick={() => handleSort("dueDate", "asc")}
                            className={cn(
                                "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                                isSortedByDueDate && sortConfig.direction === "asc" && "text-emerald-600 font-medium bg-emerald-50"
                            )}
                        >
                            Ascending
                            {isSortedByDueDate && sortConfig.direction === "asc" && <ChevronUp className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => handleSort("dueDate", "desc")}
                            className={cn(
                                "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                                isSortedByDueDate && sortConfig.direction === "desc" && "text-emerald-600 font-medium bg-emerald-50"
                            )}
                        >
                            Descending
                            {isSortedByDueDate && sortConfig.direction === "desc" && <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
