"use client"

import { useState } from "react"
import { mockAuditLogs } from "@/lib/mock-data"

export function useRegulatorAuditLogs() {
    const [search, setSearch] = useState("")
    const [entityFilter, setEntityFilter] = useState("all")

    const filteredLogs = mockAuditLogs
        .filter((log) => {
            const matchesSearch =
                log.action.toLowerCase().includes(search.toLowerCase()) ||
                log.actorName?.toLowerCase().includes(search.toLowerCase())
            const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter
            return matchesSearch && matchesEntity
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return {
        search,
        setSearch,
        entityFilter,
        setEntityFilter,
        filteredLogs
    }
}
