"use client"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, ChevronUp, ChevronDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type AssignmentSortKey = "assignedAt" | "createdAt" | "status"
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
                    <div className="px-3 py-2 text-sm font-medium text-foreground border-b mb-1 pb-2">Sort By</div>
                    <div className="px-1 flex flex-col gap-1">
                        <button
                            onClick={() => handleSort("assignedAt", "desc")}
                            className={cn(
                                "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                                sortConfig?.key === "assignedAt" && sortConfig?.direction === "desc" && "text-emerald-600 font-medium bg-emerald-50"
                            )}
                        >
                            Assigned Date (New - Old)
                        </button>
                        <button
                            onClick={() => handleSort("assignedAt", "asc")}
                            className={cn(
                                "w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-muted transition-colors flex items-center justify-between",
                                sortConfig?.key === "assignedAt" && sortConfig?.direction === "asc" && "text-emerald-600 font-medium bg-emerald-50"
                            )}
                        >
                            Assigned Date (Old - New)
                        </button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
