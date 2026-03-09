"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserService } from "@/services/user.service"
import { OrganizationService } from "@/services/organization.service"
import { User as FrontendUser, Organization, OrganizationType, OrganizationStatus } from "@/lib/types"
import { toast } from "sonner"
import { useUrlPagination } from "../common/use-url-pagination"

export function useUsers({ isEmployeesOnly = false, initialLimit = 5 } = {}) {
    const queryClient = useQueryClient()
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort, setFilter
    } = useUrlPagination(initialLimit)

    const userTypeFilter = (queryParams as any).userTypeFilter || "platform";

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    // Fetch Organizations for dropdown
    const { data: realOrganizations = [] } = useQuery<Organization[]>({
        queryKey: ["organizations"],
        queryFn: async () => {
            const response = await OrganizationService.listOrganizations()
            // @ts-ignore
            const orgs = response.data?.items || response.data || []
            return orgs.map((o: any) => ({
                id: o.id || o._id || "",
                _id: o.id || o._id || "",
                name: o.name || "",
                type: (o.type?.toUpperCase() || "COMPANY") as OrganizationType,
                status: (o.status?.toUpperCase() || "ACTIVE") as OrganizationStatus,
                employees: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            } as Organization))
        }
    })

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

    // Fetch Users from API
    const { data, isLoading, isError } = useQuery({
        queryKey: ["users", queryParams, isEmployeesOnly],
        queryFn: async () => {
            const fetchFn = isEmployeesOnly ? UserService.listEmployees : UserService.listUsers

            // Strip all frontend-only filter params before sending to backend
            const { roleFilter: _rf, userTypeFilter: _utf, ...apiParams } = queryParams as any

            const allowedSortKeys = ["createdAt", "username", "email", "role", "lastLoginAt"]
            const fetchParams = {
                ...apiParams,
                sortBy: apiParams.sortBy && allowedSortKeys.includes(apiParams.sortBy) ? apiParams.sortBy : undefined
            }

            const response = await fetchFn(fetchParams)

            let rawItems = response.data?.items || []

            // Map users to have organization names
            const mappedUsers = rawItems.map((u: any) => {
                let orgName = "FinShield"
                const org = realOrganizations.find(o => (o as any).id === u.orgId || o._id === u.orgId)
                if (org) orgName = org.name || "FinShield"
                else if (u.orgId === "org-platform") orgName = "FinShield Platform"

                return {
                    ...u,
                    _id: String(u.id || u._id || ""),
                    organizationName: orgName
                }
            }) as FrontendUser[]

            return {
                items: mappedUsers,
                pagination: response.data.pagination
            }
        },
        enabled: !!realOrganizations.length || realOrganizations.length === 0,
    })

    // Create User Mutation
    const createUserMutation = useMutation({
        mutationFn: async () => {
            setCreateError(null)
            if (["COMPANY_MANAGER", "COMPANY_USER"].includes(newUser.role) && !newUser.orgId) {
                throw new Error("Company is required for this role");
            }

            const payload = {
                email: newUser.email,
                password: "Password123!",
                username: newUser.username,
                role: newUser.role as any,
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
        mutationFn: async ({ id, status, reason }: { id: string; status: "ACTIVE" | "INACTIVE"; reason?: string }) => {
            const apiStatus = status === "INACTIVE" ? "disabled" : "active"
            const apiReason = status === "INACTIVE" ? reason : undefined
            return await UserService.updateUserStatus(id, apiStatus, apiReason)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] })
            toast.success("User status updated")
        },
        onError: (error: any) => {
            toast.error("Failed to update user status: " + (error.response?.data?.message || error.message))
        }
    })

    return {
        // Table Data & Pagination
        users: data?.items || [],
        pagination: data?.pagination,
        isLoading,
        isError,

        // URL Pagination Handlers
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'asc' } : null,
        requestSort: setSort,

        // Filters
        userTypeFilter,
        setUserTypeFilter: (val: string) => setFilter('userTypeFilter', val),

        // Create
        isCreateOpen,
        setIsCreateOpen,
        newUser,
        setNewUser,
        handleCreateUser: () => createUserMutation.mutate(),
        isCreating: createUserMutation.isPending,
        createError,
        setCreateError,

        // Status Update
        handleUpdateStatus: (userId: string, status: "ACTIVE" | "INACTIVE", reason?: string) =>
            updateStatusMutation.mutate({ id: userId, status, reason }),
        isUpdatingStatus: updateStatusMutation.isPending,

        // Context Data
        organizations: realOrganizations,
    }
}
