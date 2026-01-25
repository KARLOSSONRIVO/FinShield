"use client"

import { useState, useMemo } from "react"
import { mockOrganizations } from "@/lib/mock-data"
import { Organization } from "@/lib/types"

export type SortConfig = {
    key: keyof Organization
    direction: "asc" | "desc"
} | null

export function useOrganizations() {
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newOrgName, setNewOrgName] = useState("")

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5) // Limit to 5 as requested
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    const companies = mockOrganizations.filter((o) => o.type === "company")

    // Sort Handler
    const requestSort = (key: keyof Organization) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    // Filter & Sort Logic
    const filteredAndSortedOrgs = useMemo(() => {
        let processed = [...companies]

        // Filter
        if (search) {
            processed = processed.filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                // @ts-ignore - dynamic key access
                const aValue = a[sortConfig.key]
                // @ts-ignore
                const bValue = b[sortConfig.key]

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [companies, search, sortConfig])

    // Pagination Logic
    const totalPages = Math.ceil(filteredAndSortedOrgs.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentOrgs = filteredAndSortedOrgs.slice(startIndex, startIndex + itemsPerPage)

    const handleCreateOrg = () => {
        alert(`Creating organization: ${newOrgName}`)
        setNewOrgName("")
        setIsCreateOpen(false)
    }

    const handleEditOrg = (org: Organization) => {
        // In a real app, this would call an API
        console.log("Updating organization:", org);
        // We can just alert for now or try to update local state if we want better UX
        // For mock, let's just alert
        alert(`Updated ${org.name} successfully! Mock update.`);
    }

    const handleDeleteOrg = (id: string) => {
        // In a real app, API call
        console.log("Deleting organization:", id);
        alert(`Organization deleted successfully! Mock delete.`);
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,
        newOrgName,
        setNewOrgName,
        handleCreateOrg,
        handleEditOrg,
        handleDeleteOrg,

        // Data & Pagination
        organizations: currentOrgs,
        currentPage,
        totalPages,
        setCurrentPage,
        itemsPerPage,
        totalItems: filteredAndSortedOrgs.length,

        // Sorting
        sortConfig,
        requestSort
    }
}
