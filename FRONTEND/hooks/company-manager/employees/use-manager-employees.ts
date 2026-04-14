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
    const [disableReason, setDisableReason] = useState("")
    const [newUser, setNewUser] = useState({ email: "", username: "", role: "COMPANY_USER", orgId: "" })
    const [createError, setCreateError] = useState<string | null>(null)

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "createdAt", direction: "desc" })
    const [localStatusSort, setLocalStatusSort] = useState<"asc" | "desc" | null>(null)

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

    let users = response?.data?.items || []
    if (localStatusSort) {
        users = [...users].sort((a: any, b: any) => {
            // Active vs Disabled (ACTIVE is "active", INACTIVE is "disabled" or something similar)
            const sA = a.status || ""
            const sB = b.status || ""
            return localStatusSort === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA)
        })
    }
    const totalPages = response?.data?.pagination?.totalPages || 1

    const requestSort = (key: any, forceDirection?: "asc" | "desc") => {
        // Translate table header keys if necessary, or just use the mapped keys
        let validKey: "username" | "email" | "createdAt" = "createdAt"
        if (key === "username" || key === "email" || key === "createdAt") {
            validKey = key
        }

        let direction: "asc" | "desc" = "asc"
        if (forceDirection) {
            direction = forceDirection
        } else if (sortConfig && sortConfig.key === validKey && sortConfig.direction === "asc") {
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

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: "ACTIVE" | "INACTIVE"; reason?: string }) =>
            UserService.updateUserStatus(id, status === "INACTIVE" ? "disabled" : "active", reason || undefined),
        onSuccess: () => {
            toast.success(`Employee status updated successfully`)
            queryClient.invalidateQueries({ queryKey: ["manager-employees"] })
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to update employee status")
        }
    })

    const handleUpdateStatus = (id: string, status: "ACTIVE" | "INACTIVE", reason?: string) => {
        updateStatusMutation.mutate({ id, status, reason })
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,
        newUser,
        setNewUser,
        users,
        handleCreateUser,
        handleUpdateStatus,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort,
        localStatusSort,
        setLocalStatusSort,
        isLoading
    }
}
