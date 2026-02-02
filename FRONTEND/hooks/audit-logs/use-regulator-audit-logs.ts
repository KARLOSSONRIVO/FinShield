"use client"

import { useState, useMemo } from "react"
import { mockAuditLogs } from "@/lib/mock-data"
import { AuditLog } from "@/lib/types"

export type EntityFilter = "all" | AuditLog['entity_type']

export function useRegulatorAuditLogs() {
    const [search, setSearch] = useState("")
    const [entityFilter, setEntityFilter] = useState<EntityFilter>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    const filteredLogs = useMemo(() => {
        let result = [...mockAuditLogs]

        if (search) {
            const lowerSearch = search.toLowerCase()
            result = result.filter(log =>
                log.action.toLowerCase().includes(lowerSearch) ||
                (log.actorName && log.actorName.toLowerCase().includes(lowerSearch)) ||
                log.entity_id.toLowerCase().includes(lowerSearch)
            )
        }

        if (entityFilter !== "all") {
            result = result.filter(log => log.entity_type === entityFilter)
        }

        // Sort by newest first
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return result
    }, [search, entityFilter])

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage)

    return {
        search,
        setSearch,
        entityFilter,
        setEntityFilter,
        logs: currentLogs,
        currentPage,
        totalPages,
        setCurrentPage
    }
}
