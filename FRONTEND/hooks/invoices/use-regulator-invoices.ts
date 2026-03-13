import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { DateRange } from "react-day-picker"

const LIMIT = 7

export function useRegulatorInvoices() {
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
            setSortKey(key); setSortDir(direction)
        } else if (sortKey === key) {
            if (sortDir === 'asc') setSortDir('desc')
            else setSortKey(null)
        } else {
            setSortKey(key); setSortDir('asc')
        }
        setPage(1)
    }

    const resetFilters = () => {
        setSearchState(""); setStatusFilterState("all"); setAiVerdictFilterState("all")
        setDateRangeState(undefined); setMonthFilterState("all"); setYearFilterState("all")
        setSortKey(null); setPage(1)
    }

    const { data: response, isLoading, isError, error } = useQuery({
        queryKey: ["invoices", "regulator"],
        queryFn: () => InvoiceService.list()
    })

    const allInvoices = response?.data?.items || []

    // Derive available years from the actual data
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
            items = items.filter((inv: any) =>
                inv.invoiceNumber?.toLowerCase().includes(q) ||
                inv.companyName?.toLowerCase().includes(q)
            )
        }
        if (aiVerdictFilter !== "all") {
            items = items.filter((inv: any) => inv.aiVerdict?.verdict?.toLowerCase() === aiVerdictFilter)
        }
        if (statusFilter !== "all") {
            items = items.filter((inv: any) => (inv.status || "pending").toLowerCase() === statusFilter)
        }
        if (dateRange?.from || dateRange?.to) {
            items = items.filter((inv: any) => {
                const dStr = inv.date || inv.invoiceDate || inv.uploadedAt || inv.createdAt || ""
                const d = new Date(dStr)
                if (isNaN(d.getTime())) return false
                if (dateRange.from && d < dateRange.from) return false
                if (dateRange.to) { const t = new Date(dateRange.to); t.setHours(23,59,59,999); if (d > t) return false }
                return true
            })
        }
        if (monthFilter !== "all" || yearFilter !== "all") {
            items = items.filter((inv: any) => {
                const dStr = inv.date || inv.invoiceDate || inv.uploadedAt || inv.createdAt || ""
                const d = new Date(dStr)
                if (isNaN(d.getTime())) return false
                if (monthFilter !== "all" && d.getMonth() !== Number(monthFilter)) return false
                if (yearFilter !== "all" && d.getFullYear() !== Number(yearFilter)) return false
                return true
            })
        }
        if (sortKey) {
            const k = sortKey, dir = sortDir
            items = [...items].sort((a, b) => {
                const actualKey = k === 'reviewDecision' ? 'status' : k
                let av = (a as any)[actualKey], bv = (b as any)[actualKey]
                
                if (k === 'invoiceDate' || k === 'createdAt' || k === 'date') {
                    av = (a as any).date || (a as any).invoiceDate || (a as any).uploadedAt || (a as any).createdAt
                    bv = (b as any).date || (b as any).invoiceDate || (b as any).uploadedAt || (b as any).createdAt
                }

                if (av === bv) return 0
                if (av == null) return 1; if (bv == null) return -1
                
                if (k === 'invoiceDate' || k === 'createdAt' || k === 'date') {
                    const aDate = new Date(av).getTime()
                    const bDate = new Date(bv).getTime()
                    return dir === 'desc' ? bDate - aDate : aDate - bDate
                }
                if (typeof av === 'number' && typeof bv === 'number') return dir === 'desc' ? bv - av : av - bv
                return dir === 'desc' ? String(bv).toLowerCase().localeCompare(String(av).toLowerCase()) : String(av).toLowerCase().localeCompare(String(bv).toLowerCase())
            })
        }

        const total = items.length
        const start = (page - 1) * LIMIT
        return { filteredInvoices: items.slice(start, start + LIMIT), pagination: { total, page, limit: LIMIT, totalPages: Math.ceil(total / LIMIT) } }
    }, [allInvoices, search, aiVerdictFilter, statusFilter, dateRange, monthFilter, yearFilter, sortKey, sortDir, page])

    const sortConfig = sortKey ? { key: sortKey, direction: sortDir } : null
    const hasActiveFilters = statusFilter !== "all" || aiVerdictFilter !== "all" || !!(dateRange?.from || dateRange?.to) || monthFilter !== "all" || yearFilter !== "all"

    return {
        invoices: filteredInvoices, pagination, isLoading, isError, error: error ? (error as any).message : null,
        search, setSearch, setPage, sortConfig, requestSort,
        statusFilter, setStatusFilter, aiVerdictFilter, setAiVerdictFilter,
        dateRange, setDateRange, monthFilter, setMonthFilter, yearFilter, setYearFilter,
        availableYears, resetFilters, hasActiveFilters
    }
}
