"use client"

import { useState, useMemo } from "react"
import { mockUsers, mockOrganizations } from "@/lib/mock-data"
import { User } from "@/lib/types"

export type SortConfig = {
    key: keyof User
    direction: "asc" | "desc"
} | null

export function useUsers() {
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [disableUserId, setDisableUserId] = useState<string | null>(null)
    const [disableReason, setDisableReason] = useState("")
    const [newUser, setNewUser] = useState({ email: "", username: "", role: "", orgId: "" })

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)
    const [userTypeFilter, setUserTypeFilter] = useState<"all" | "platform" | "company">("platform")

    // Sort Handler
    const requestSort = (key: keyof User) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedUsers = useMemo(() => {
        let processed = [...mockUsers]

        // Filter by Type
        if (userTypeFilter === "platform") {
            processed = processed.filter(u => u.orgId === "org-platform")
        } else if (userTypeFilter === "company") {
            processed = processed.filter(u => u.orgId !== "org-platform")
        }

        // Filter by Search
        if (search) {
            processed = processed.filter(u =>
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                u.username.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                // @ts-ignore
                const aValue = a[sortConfig.key]
                // @ts-ignore
                const bValue = b[sortConfig.key]

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [mockUsers, search, sortConfig, userTypeFilter])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)


    const handleCreateUser = () => {
        alert(`Creating user: ${newUser.email} as ${newUser.role}`)
        setNewUser({ email: "", username: "", role: "", orgId: "" })
        setIsCreateOpen(false)
    }

    const handleDisableUser = () => {
        alert(`Disabling user ${disableUserId} - Reason: ${disableReason}`)
        setDisableUserId(null)
        setDisableReason("")
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,
        disableUserId,
        setDisableUserId,
        disableReason,
        setDisableReason,
        newUser,
        setNewUser,
        userTypeFilter,
        setUserTypeFilter,

        users: currentUsers,
        organizations: mockOrganizations,
        handleCreateUser,
        handleDisableUser,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}
