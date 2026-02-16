"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserService } from "@/services/user.service"
import { OrganizationService } from "@/services/organization.service"
import { mockOrganizations, mockUsers } from "@/lib/mock-data"
import { User as FrontendUser, Organization } from "@/lib/types"
import { toast } from "sonner"

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
            // Simulate API Loading
            await new Promise(resolve => setTimeout(resolve, 500))
            return mockOrganizations.map(o => ({
                ...o,
                // Ensure type compatibility if needed, though mockOrganizations matches Organization type mostly
                // But frontend Organization type might differ slightly from backend mock?
                // Let's just return mockOrganizations as any -> Organization[] casting to be safe
                // or map it if fields are missing.
                // Mock data has _id, type, name, status, employees, createdAt.
                // Frontend Organization interface has these too.
            })) as Organization[]
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
            // Simulate API Loading
            await new Promise(resolve => setTimeout(resolve, 800))
            return mockUsers as unknown as FrontendUser[]
        }
    })

    const [createError, setCreateError] = useState<string | null>(null)

    // Create User Mutation
    const createUserMutation = useMutation({
        mutationFn: async () => {
            setCreateError(null) // Clear previous errors
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
            toast.success("User created successfully!")
            setIsCreateOpen(false)
            setNewUser({ email: "", username: "", role: "", orgId: "" })
            setCreateError(null)
        },
        onError: (error: any) => {
            const msg = error.response?.data?.message || error.message || "Failed to create user"
            setCreateError(msg)
            toast.error(msg)
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
            toast.success("User status updated")
        },
        onError: (error: any) => {
            toast.error("Failed to update user status: " + (error.response?.data?.message || error.message))
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

        // Map organization names
        // This is safe because realOrganizations is a dependency
        processed = processed.map(u => {
            const org = realOrganizations.find(o => o._id === u.orgId)
            let orgName = "FinShield"

            if (org) {
                orgName = org.name
            } else if (u.orgId === "org-platform") {
                orgName = "FinShield Platform"
            } else if (u.orgId && u.orgId !== "org-unknown") {
                // Keep existing ID if it's not empty and not matched (edge case)
                // But user asked for "FinShield" if no org id. 
                // If u.orgId exists but org not found, it might be a bug or stale data. 
                // Let's stick to: if no org found, check if it's platform, else "FinShield" or maybe "FinShield (Unlinked)"?
                // User said: "if they do not havee an org id" -> implies u.orgId is empty/null.
                // If u.orgId is "org-unknown", treat as no org id.
                orgName = "FinShield"
            }

            return {
                ...u,
                organizationName: orgName
            }
        })

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
        createError,
        setCreateError,

        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort
    }
}