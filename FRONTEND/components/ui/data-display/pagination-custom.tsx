"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
    totalPages: number
    currentPage: number
    onPageChange: (page: number) => void
}

export function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
    
    const maxVisible = 5;

    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            {startPage > 1 && (
                <>
                    <Button variant="ghost" className="w-9 h-9 p-0" onClick={() => onPageChange(1)}>1</Button>
                    {startPage > 2 && <span className="text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></span>}
                </>
            )}

            {pages.map(page => (
                <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    className={`w-9 h-9 p-0 ${currentPage === page ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
                    onClick={() => onPageChange(page)}
                >
                    {page}
                </Button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && <span className="text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></span>}
                    <Button variant="ghost" className="w-9 h-9 p-0" onClick={() => onPageChange(totalPages)}>{totalPages}</Button>
                </>
            )}

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
