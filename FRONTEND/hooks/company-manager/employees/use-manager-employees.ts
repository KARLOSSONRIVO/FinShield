"use client"

import { useState, useMemo } from "react"
import { mockUsers, mockInvoices } from "@/lib/mock-data"
import { User } from "@/lib/types"

export type SortConfig = {
    key: keyof ManagerUser
    direction: "asc" | "desc"
} | null

export type ManagerUser = User & { invoiceCount: number }

export function useManagerEmployees() {
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [disableUserId, setDisableUserId] = useState<string | null>(null)
    const [disableReason, setDisableReason] = useState("")
    const [newUser, setNewUser] = useState({ email: "", username: "", role: "COMPANY_USER", orgId: "org-company-1" })

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(7)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    // Sort Handler
    const requestSort = (key: keyof ManagerUser) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedUsers = useMemo(() => {
        // 1. Filter by Company Organization and Enhance with Invoice Count
        let processed: ManagerUser[] = mockUsers
            .filter(u => u.orgId === "org-company-1")
            .map(u => ({
                ...u,
                invoiceCount: mockInvoices.filter(inv => inv.uploadedByUserId === u._id).length
            }))

        // 2. Filter by Search
        if (search) {
            processed = processed.filter(u =>
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                u.username.toLowerCase().includes(search.toLowerCase())
            )
        }

        // 3. Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                // @ts-ignore
                const aValue = a[sortConfig.key]
                // @ts-ignore
                const bValue = b[sortConfig.key]

                if (aValue === bValue) return 0
                if (aValue === undefined || aValue === null) return 1
                if (bValue === undefined || bValue === null) return -1

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [search, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)

    const handleCreateUser = () => {
        alert(`Creating employee: ${newUser.email}`)
        setIsCreateOpen(false)
    }

    const handleDisableUser = (userId: string) => {
        alert(`Disabling employee ${userId}`)
        setDisableUserId(null)
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,
        disableUserId,
        setDisableUserId, // Expose setter
        disableReason,
        setDisableReason,
        newUser,
        setNewUser,

        users: currentUsers,
        handleCreateUser,
        handleDisableUser,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}
