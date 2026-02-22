import { cn } from "@/lib/utils"
import { PaginationDetails } from "@/lib/types"

interface DataPaginationProps {
    pagination?: PaginationDetails
    onPageChange: (page: number) => void
}

export function DataPagination({ pagination, onPageChange }: DataPaginationProps) {
    if (!pagination || pagination.totalPages <= 1) return null

    const { page: currentPage, totalPages } = pagination

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages)
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
            }
        }
        return pages
    }

    return (
        <div className="flex items-center justify-center space-x-2 py-6 text-sm font-medium text-muted-foreground w-full">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={cn(
                    "hover:text-foreground transition-colors px-2",
                    currentPage <= 1 && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
            >
                &lt;&lt; Prev
            </button>

            {getPageNumbers().map((p, i) => {
                if (p === '...') {
                    return <span key={`ellipsis-${i}`} className="px-2">...</span>
                }
                const pageNum = p as number
                const isActive = pageNum === currentPage

                return (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={cn(
                            "px-3 py-1 rounded transition-colors",
                            isActive
                                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                                : "hover:bg-muted/50 hover:text-foreground"
                        )}
                    >
                        {pageNum}
                    </button>
                )
            })}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={cn(
                    "hover:text-foreground transition-colors px-2",
                    currentPage >= totalPages && "opacity-50 cursor-not-allowed pointer-events-none"
                )}
            >
                Next &gt;&gt;
            </button>
        </div>
    )
}
