"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserService } from "@/services/user.service"
import { OrganizationService } from "@/services/organization.service"
import { mockOrganizations } from "@/lib/mock-data"
import { User as FrontendUser, Organization } from "@/lib/types"

export type SortConfig = {
    key: keyof FrontendUser
    direction: "asc" | "desc"
} | null

export function useUsers() {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [disableUserId, setDisableUserId] = useState<string | null>(null)
    const [reason, setReason] = useState("")

    // Fetch Organizations for dropdown
    const { data: realOrganizations = [] } = useQuery<Organization[]>({
        queryKey: ["organizations"],
        queryFn: async () => {
            const response = await OrganizationService.listOrganizations()
            if (!response.ok || !response.data) return []

            // Map API response to Frontend Organization interface
            return response.data.map((o: any) => ({
                _id: o.id,
                name: o.name,
                type: o.type === "COMPANY" ? "company" : "platform", // Map types appropriately
                status: o.status === "ACTIVE" ? "active" : "inactive",
                employees: o.employees || 0,
                createdAt: o.createdAt ? new Date(o.createdAt) : new Date(0),
                updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(0)
            }))
        }
    })

    // Updated newUser state to match API requirements (Username only, no First/Last)
    type NewUserState = {
        email: string
        username: string
        role: string
        orgId: string
    }

    const [newUser, setNewUser] = useState<NewUserState>({
        email: "",
        username: "",
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
                username: u.username || u.email, // Use username if available
                status: (u.status || "active").toLowerCase(),
                mustChangePassword: u.mustChangePassword,
                createdAt: new Date(u.createdAt || 0),
                updatedAt: new Date(u.updatedAt || 0),
            } as FrontendUser))

            console.log("Mapped Users:", mapped);
            return mapped;
        }
    })

    // Create User Mutation
    const createUserMutation = useMutation({
        mutationFn: async () => {
            // Validate payload before sending
            if (["COMPANY_MANAGER", "COMPANY_USER"].includes(newUser.role) && !newUser.orgId) {
                throw new Error("Company is required for this role");
            }

            // Map frontend state to API payload
            const payload = {
                email: newUser.email,
                password: "Password123!", // Temp default password
                username: newUser.username,
                role: newUser.role as any,
                // Sanitize orgId: safely handle null/undefined, trim whitespace, and convert empty strings to undefined
                orgId: (newUser.orgId || "").trim() || undefined
            }
            return await UserService.createUser(payload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            alert("User created successfully!")
            setIsCreateOpen(false)
            setNewUser({ email: "", username: "", role: "", orgId: "" })
        },
        onError: (error: any) => {
            alert("Failed to create user: " + (error.response?.data?.message || error.message))
        }
    })

    // Update User Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: string; status: "ACTIVE" | "SUSPENDED"; reason?: string }) => {
            // Backend expects 'disabled' (lowercase) for suspension based on error message "expected one of 'active'|'disabled'"
            const apiStatus = status === "SUSPENDED" ? "disabled" : "active"
            // Only pass reason if status is SUSPENDED (disabled). Pass undefined for active to avoid Zod validation error on empty string.
            const apiReason = status === "SUSPENDED" ? reason : undefined
            return await UserService.updateUserStatus(id, apiStatus as any, apiReason)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
        },
        onError: (error: any) => {
            alert("Failed to update user status: " + (error.response?.data?.message || error.message))
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
            processed = processed.filter(u => ["SUPER_ADMIN", "AUDITOR", "REGULATOR", "COMPANY_MANAGER"].includes(u.role))
        } else if (userTypeFilter === "company") {
            processed = processed.filter(u => ["COMPANY_USER"].includes(u.role))
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
                // ... (handling undefined/null/asc/desc)
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

    const handleUpdateStatus = (id: string, status: "ACTIVE" | "SUSPENDED", reason?: string) => {
        updateStatusMutation.mutate({ id, status, reason })
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,

        newUser,
        setNewUser,
        userTypeFilter,
        setUserTypeFilter,

        users: currentUsers,
        organizations: realOrganizations, // Use real orgs
        handleCreateUser,
        handleUpdateStatus,
        isCreating: createUserMutation.isPending,
        isUpdatingStatus: updateStatusMutation.isPending,
        isLoading,
        isError,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}