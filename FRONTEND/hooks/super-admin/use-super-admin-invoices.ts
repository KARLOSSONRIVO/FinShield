import { useState, useMemo, useContext, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { SocketContext } from "@/providers/socket-provider"
import { useSocketEvent } from "@/hooks/global/use-socket-event"
import { SocketEvents } from "@/lib/socket-events"
import { DateRange } from "react-day-picker"

export type SortConfig = {
    key: "createdAt" | "invoiceNumber" | "invoiceDate" | "totalAmount" | "reviewDecision" | "organizationId"
    direction: 'asc' | 'desc'
}

const LIMIT = 7

export function useSuperAdminInvoices() {
    const queryClient = useQueryClient()
    const socketCtx = useContext(SocketContext)

    const [search, setSearchState] = useState("")
    const [page, setPage] = useState(1)
    const [sortKey, setSortKey] = useState<string | null>(null)
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
    const [statusFilter, setStatusFilterState] = useState("all")
    const [aiVerdictFilter, setAiVerdictFilterState] = useState("all")
    const [dateRange, setDateRangeState] = useState<DateRange | undefined>(undefined)
    const [monthFilter, setMonthFilterState] = useState("all")
    const [yearFilter, setYearFilterState] = useState("all")

    const setSearch = (val: string) => { setSearchState(val); setPage(1) }
    const setStatusFilter = (val: string) => { 
        setStatusFilterState(val); 
        if (val !== "all") setAiVerdictFilterState("all");
        setPage(1) 
    }
    const setAiVerdictFilter = (val: string) => { 
        setAiVerdictFilterState(val); 
        if (val !== "all") setStatusFilterState("all");
        setPage(1) 
    }
    const setDateRange = (val: DateRange | undefined) => { setDateRangeState(val); setPage(1) }
    const setMonthFilter = (val: string) => { setMonthFilterState(val); setPage(1) }
    const setYearFilter = (val: string) => { setYearFilterState(val); setPage(1) }

    const requestSort = (key: string, direction?: 'asc' | 'desc') => {
        if (direction !== undefined) {
            setSortKey(key)
            setSortDir(direction)
        } else if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc')
            else setSortKey(null)
        } else {
            setSortKey(key)
            setSortDir('asc')
        }
        setPage(1)
    }

    const resetFilters = useCallback(() => {
        setSearchState(""); setStatusFilterState("all"); setAiVerdictFilterState("all")
        setDateRangeState(undefined); setMonthFilterState("all"); setYearFilterState("all")
        setSortKey(null); setPage(1)
    }, [])

    const invalidateList = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["invoices", "super-admin"] })
    }, [queryClient])

    useSocketEvent(socketCtx, SocketEvents.INVOICE_LIST_INVALIDATE, invalidateList)
    useSocketEvent(socketCtx, SocketEvents.INVOICE_AI_COMPLETE, invalidateList)
    useSocketEvent(socketCtx, SocketEvents.INVOICE_FLAGGED, invalidateList)
    useSocketEvent(socketCtx, SocketEvents.INVOICE_ANCHOR_SUCCESS, invalidateList)

    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ["invoices", "super-admin"],
        queryFn: () => InvoiceService.list()
    })

    const allInvoices = response?.data?.items || []

    const availableYears = useMemo(() => {
        const years = new Set<number>()
        allInvoices.forEach((inv: any) => {
            const dStr = inv.date || inv.invoiceDate || inv.uploadedAt || inv.createdAt || ""
            const d = new Date(dStr)
            if (!isNaN(d.getTime())) years.add(d.getFullYear())
        })
        return Array.from(years).sort((a, b) => b - a)
    }, [allInvoices])

    const { filteredInvoices, pagination } = useMemo(() => {
        let items = [...allInvoices]

        if (search.trim()) {
            const q = search.trim().toLowerCase()
            items = items.filter(inv =>
                inv.invoiceNumber?.toLowerCase().includes(q) ||
                inv.companyName?.toLowerCase().includes(q)
            )
        }
        if (aiVerdictFilter !== "all") {
            items = items.filter(inv => inv.aiVerdict?.verdict?.toLowerCase() === aiVerdictFilter)
        }
        if (statusFilter !== "all") {
            items = items.filter(inv => {
                const status = (inv.status || inv.reviewDecision || "pending").toLowerCase()
                return status === statusFilter
            })
        }
        if (dateRange?.from || dateRange?.to) {
            items = items.filter(inv => {
                const dateStr = inv.date || inv.invoiceDate || inv.uploadedAt || inv.createdAt
                if (!dateStr) return false
                const date = new Date(dateStr)
                if (isNaN(date.getTime())) return false
                if (dateRange.from && date < dateRange.from) return false
                if (dateRange.to) {
                    const toDate = new Date(dateRange.to)
                    toDate.setHours(23, 59, 59, 999)
                    if (date > toDate) return false
                }
                return true
            })
        }
        if (monthFilter !== "all" || yearFilter !== "all") {
            items = items.filter(inv => {
                const dateStr = inv.date || inv.invoiceDate || inv.uploadedAt || inv.createdAt
                if (!dateStr) return false
                const d = new Date(dateStr)
                if (isNaN(d.getTime())) return false
                if (monthFilter !== "all" && d.getMonth() !== Number(monthFilter)) return false
                if (yearFilter !== "all" && d.getFullYear() !== Number(yearFilter)) return false
                return true
            })
        }
        if (sortKey) {
            const key = sortKey
            const direction = sortDir
            items = [...items].sort((a, b) => {
                const actualKey = key === 'reviewDecision' ? 'status' : key
                let aVal = (a as any)[actualKey]
                let bVal = (b as any)[actualKey]
                if (key === 'invoiceDate' || key === 'createdAt' || key === 'date') {
                    aVal = (a as any).date || (a as any).invoiceDate || (a as any).uploadedAt || (a as any).createdAt
                    bVal = (b as any).date || (b as any).invoiceDate || (b as any).uploadedAt || (b as any).createdAt
                }
                if (aVal === bVal) return 0
                if (aVal == null) return 1
                if (bVal == null) return -1
                if (key === 'invoiceDate' || key === 'createdAt' || key === 'date') {
                    const da = new Date(aVal).getTime(), db = new Date(bVal).getTime()
                    return direction === 'desc' ? db - da : da - db
                }
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return direction === 'desc' ? bVal - aVal : aVal - bVal
                }
                const sa = String(aVal).toLowerCase(), sb = String(bVal).toLowerCase()
                return direction === 'desc' ? sb.localeCompare(sa) : sa.localeCompare(sb)
            })
        }

        const total = items.length
        const totalPages = Math.ceil(total / LIMIT)
        const start = (page - 1) * LIMIT
        return {
            filteredInvoices: items.slice(start, start + LIMIT),
            pagination: { total, page, limit: LIMIT, totalPages }
        }
    }, [allInvoices, search, aiVerdictFilter, statusFilter, dateRange, monthFilter, yearFilter, sortKey, sortDir, page])

    const sortConfig = sortKey ? { key: sortKey as SortConfig['key'], direction: sortDir } : null
    const hasActiveFilters =
        statusFilter !== "all" || aiVerdictFilter !== "all" ||
        !!(dateRange?.from || dateRange?.to) ||
        monthFilter !== "all" || yearFilter !== "all"

    return {
        availableYears,
        invoices: filteredInvoices,
        pagination,
        isLoading,
        isError,
        error: error ? (error as any).message : null,
        search,
        setSearch,
        setPage,
        sortConfig,
        requestSort,
        statusFilter,
        setStatusFilter,
        aiVerdictFilter,
        setAiVerdictFilter,
        dateRange,
        setDateRange,
        monthFilter,
        setMonthFilter,
        yearFilter,
        setYearFilter,
        resetFilters,
        hasActiveFilters
    }
}
