"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserService } from "@/services/user.service"
import { mockOrganizations } from "@/lib/mock-data"
import { User as FrontendUser } from "@/lib/types"

export type SortConfig = {
    key: keyof FrontendUser
    direction: "asc" | "desc"
} | null

export function useUsers() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [disableUserId, setDisableUserId] = useState<string | null>(null)
    const [disableReason, setDisableReason] = useState("")
    // Updated newUser state to match API requirements
    const [newUser, setNewUser] = useState({
        email: "",
        firstName: "",
        lastName: "",
        role: "",
        orgId: ""
    })

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)
    const [userTypeFilter, setUserTypeFilter] = useState<"all" | "platform" | "company">("platform")

    // Fetch Users (Real API)
    const { data: apiUsers = [], isLoading, isError } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const token = localStorage.getItem("token");

            const response = await UserService.listUsers()

            // Map API User to Frontend User
            const mapped = (response.data || []).map((u: any) => ({
                _id: u.id,
                orgId: u.organizationId || "org-unknown",
                portal: "user", // Default
                role: u.role,
                email: u.email,
                username: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
                status: (u.status || "active").toLowerCase(),
                mustChangePassword: u.mustChangePassword,
                createdAt: new Date(u.createdAt || Date.now()),
                updatedAt: new Date(u.updatedAt || Date.now()),
            } as FrontendUser))

            console.log("Mapped Users:", mapped);
            return mapped;
        }
    })

    // Create User Mutation
    const createUserMutation = useMutation({
        mutationFn: async () => {
            // Map frontend state to API payload
            const payload = {
                email: newUser.email,
                password: "Password123!", // Temp default password
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role as any,
                organizationId: newUser.orgId
            }
            return await UserService.createUser(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            alert("User created successfully!")
            setIsCreateOpen(false)
            setNewUser({ email: "", firstName: "", lastName: "", role: "", orgId: "" })
        },
        onError: (error: any) => {
            alert("Failed to create user: " + (error.response?.data?.message || error.message))
        }
    })

    // Disable User Mutation
    const disableUserMutation = useMutation({
        mutationFn: async () => {
            if (!disableUserId) return
            return await UserService.updateUserStatus(disableUserId, "SUSPENDED")
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            alert("User disabled successfully")
            setDisableUserId(null)
            setDisableReason("")
        },
        onError: (error: any) => {
            alert("Failed to disable user: " + (error.response?.data?.message || error.message))
        }
    })

    // Sort Handler
    const requestSort = (key: keyof FrontendUser) => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedUsers = useMemo(() => {
        let processed = [...apiUsers]

        // Filter by Type (Mock logic based on fake orgs for now, or real if we had org data)
        // For now, assume 'platform' = SUPER_ADMIN/AUDITOR/REGULATOR, 'company' = others?
        // Or simplistic filter if orgId is present
        if (userTypeFilter === "platform") {
            // Adapt logic: if role is admin-ish
            processed = processed.filter(u => ["SUPER_ADMIN", "AUDITOR", "REGULATOR"].includes(u.role))
        } else if (userTypeFilter === "company") {
            processed = processed.filter(u => ["COMPANY_MANAGER", "COMPANY_USER"].includes(u.role))
        }

        // Filter by Search
        if (search) {
            const lowerSearch = search.toLowerCase()
            processed = processed.filter(u =>
                u.email.toLowerCase().includes(lowerSearch) ||
                u.username.toLowerCase().includes(lowerSearch)
            )
        }

        // Sort
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
    }, [apiUsers, search, sortConfig, userTypeFilter])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentUsers = filteredAndSortedUsers.slice(startIndex, startIndex + itemsPerPage)


    const handleCreateUser = () => {
        createUserMutation.mutate()
    }

    const handleDisableUser = () => {
        disableUserMutation.mutate()
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
        organizations: mockOrganizations, // Still mock for now
        handleCreateUser,
        handleDisableUser,
        isCreating: createUserMutation.isPending,
        isDisabling: disableUserMutation.isPending,
        isLoading,
        isError,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}
