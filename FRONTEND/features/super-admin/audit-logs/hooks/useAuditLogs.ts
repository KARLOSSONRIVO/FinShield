"use client"

import { useState, useMemo } from "react"
import { mockAuditLogs } from "@/lib/mock-data"
import { AuditLog, EntityType } from "@/lib/types"

export type SortConfig = {
    key: keyof AuditLog
    direction: "asc" | "desc"
} | null

export type EntityFilter = "all" | EntityType

export function useAuditLogs() {
    const [search, setSearch] = useState("")
    const [entityFilter, setEntityFilter] = useState<EntityFilter>("all")

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5) // Match user expectation of 5 per page
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "createdAt", direction: "desc" })

    const requestSort = (key: keyof AuditLog) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedLogs = useMemo(() => {
        let processed = [...mockAuditLogs]

        // Filter by Search
        if (search) {
            processed = processed.filter(log =>
                log.action.toLowerCase().includes(search.toLowerCase()) ||
                (log.actorName && log.actorName.toLowerCase().includes(search.toLowerCase())) ||
                (log.actorEmail && log.actorEmail.toLowerCase().includes(search.toLowerCase())) ||
                log.entity_id.includes(search)
            )
        }

        // Filter by Entity
        if (entityFilter !== "all") {
            processed = processed.filter(log => log.entity_type === entityFilter)
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                const aValue = a[sortConfig.key] ?? ""
                const bValue = b[sortConfig.key] ?? ""

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [search, entityFilter, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentLogs = filteredAndSortedLogs.slice(startIndex, startIndex + itemsPerPage)

    return {
        search,
        setSearch,
        entityFilter,
        setEntityFilter,
        logs: currentLogs,
        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}
