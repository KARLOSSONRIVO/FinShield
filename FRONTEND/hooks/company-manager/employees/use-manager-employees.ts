"use client"

import { useState, useMemo } from "react"
import { mockUsers, mockInvoices } from "@/lib/mock-data"
import { User } from '@/types'
import { toast } from "sonner"

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
    const [createError, setCreateError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    
    const [mounted, setMounted] = useState(false)
    if (!mounted) {
        setTimeout(() => {
            setIsLoading(false)
            setMounted(true)
        }, 1000)
    }

    
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(7)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    
    const requestSort = (key: keyof ManagerUser) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedUsers = useMemo(() => {
        
        let processed: ManagerUser[] = mockUsers
            .filter(u => u.orgId === "org-company-1")
            .map(u => ({
                ...u,
                invoiceCount: mockInvoices.filter(inv => inv.uploadedByUserId === u._id).length
            }))

        
        if (search) {
            processed = processed.filter(u =>
                u.email.toLowerCase().includes(search.toLowerCase()) ||
                u.username.toLowerCase().includes(search.toLowerCase())
            )
        }

        
        if (sortConfig) {
            processed.sort((a, b) => {
                
                const aValue = a[sortConfig.key]
                
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

    
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)

    const handleCreateUser = () => {
        setCreateError(null)
        
        if (newUser.username === "duplicate") {
            setCreateError("Username already exists")
            toast.error("Username already exists")
            return
        }
        
        toast.success(`Creating employee: ${newUser.email}`)
        setIsCreateOpen(false)
        setCreateError(null)
    }

    const handleDisableUser = (userId: string) => {
        
        toast.info(`Disabling employee ${userId}`)
        setDisableUserId(null)
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
        createError,
        setCreateError,

        users: currentUsers,
        handleCreateUser,
        handleDisableUser,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort,
        isLoading
    }
}
