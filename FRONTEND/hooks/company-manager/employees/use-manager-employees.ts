"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserService } from "@/services/user.service"
import { toast } from "sonner"

export type SortConfig = {
    key: "username" | "email" | "createdAt"
    direction: "asc" | "desc"
} | null

export function useManagerEmployees() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [disableUserId, setDisableUserId] = useState<string | null>(null)
    const [disableReason, setDisableReason] = useState("")
    const [newUser, setNewUser] = useState({ email: "", username: "", role: "COMPANY_USER", orgId: "" })
    const [createError, setCreateError] = useState<string | null>(null)

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "createdAt", direction: "desc" })

    // Build query params
    const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...(search && { search }),
        ...(sortConfig && { sortBy: sortConfig.key, order: sortConfig.direction })
    }

    const { data: response, isLoading } = useQuery({
        queryKey: ["manager-employees", queryParams],
        queryFn: () => UserService.listEmployees(queryParams)
    })

    const users = response?.data?.items || []
    const totalPages = response?.data?.pagination?.totalPages || 1

    const requestSort = (key: any) => {
        // Translate table header keys if necessary, or just use the mapped keys
        let validKey: "username" | "email" | "createdAt" = "createdAt"
        if (key === "username" || key === "email" || key === "createdAt") {
            validKey = key
        } else if (key === "status") {
            // The API doesn't formally support "status" sorting per Swagger, but fallback to createdAt
            validKey = "createdAt"
        }

        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === validKey && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key: validKey, direction })
    }

    const createMutation = useMutation({
        mutationFn: () => UserService.createUser({
            email: newUser.email,
            username: newUser.username,
            role: "COMPANY_USER",
            password: "Password123!" // Default password
        }),
        onSuccess: () => {
            toast.success(`Created employee: ${newUser.email}`)
            setIsCreateOpen(false)
            setNewUser({ email: "", username: "", role: "COMPANY_USER", orgId: "" })
            queryClient.invalidateQueries({ queryKey: ["manager-employees"] })
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to create user"
            setCreateError(msg)
            toast.error(msg)
        }
    })

    const handleCreateUser = () => {
        setCreateError(null)
        createMutation.mutate()
    }

    const disableMutation = useMutation({
        mutationFn: (userId: string) => UserService.updateUserStatus(userId, "disabled"),
        onSuccess: () => {
            toast.success(`Employee disabled successfully`)
            setDisableUserId(null)
            queryClient.invalidateQueries({ queryKey: ["manager-employees"] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to disable employee")
        }
    })

    const handleDisableUser = (userId: string) => {
        disableMutation.mutate(userId)
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
        createError,
        setCreateError,

        users,
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
