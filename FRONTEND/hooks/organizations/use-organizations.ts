"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { OrganizationService, Organization } from "@/services/organization.service"
import { toast } from "sonner"
import { useUrlPagination } from "../common/use-url-pagination"

export function useOrganizations({ initialLimit = 10 } = {}) {
    const queryClient = useQueryClient()
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort
    } = useUrlPagination(initialLimit)

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newOrgName, setNewOrgName] = useState("")
    const [newOrgType, setNewOrgType] = useState("")
    const [newOrgEmployeeCount, setNewOrgEmployeeCount] = useState("")
    const [newOrgStatus, setNewOrgStatus] = useState("active")
    const [createError, setCreateError] = useState<string | null>(null)

    // Fetch Organizations
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["organizations", queryParams],
        queryFn: async () => {
            const response = await OrganizationService.listOrganizations(queryParams)

            // Handle both unified PaginatedResponse or legacy array fallback
            // @ts-ignore
            if (response.data && Array.isArray(response.data)) {
                // Fallback if backend isn't paginated yet
                const rawData = response.data
                return {
                    items: rawData.map((o: any) => ({
                        id: String(o.id || o._id),
                        name: o.name,
                        type: (o.type || "").toUpperCase() as "COMPANY" | "AUDITOR" | "REGULATOR",
                        status: (o.status || "ACTIVE").toUpperCase() as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                        createdAt: o.createdAt,
                        updatedAt: o.updatedAt,
                    })),
                    pagination: { total: rawData.length, page: 1, limit: rawData.length, totalPages: 1 }
                }
            }

            // Standard Paginated Response
            const rawItems: any[] = response.data?.items || []
            const items = rawItems.map(o => ({
                id: String(o.id || o._id),
                name: o.name,
                type: (o.type || "").toUpperCase() as "COMPANY" | "AUDITOR" | "REGULATOR",
                status: (o.status || "ACTIVE").toUpperCase() as "ACTIVE" | "INACTIVE" | "SUSPENDED",
                createdAt: o.createdAt,
                updatedAt: o.updatedAt,
            }))

            return {
                items,
                pagination: response.data?.pagination || { total: items.length, page: 1, limit: items.length, totalPages: 1 }
            }
        }
    })

    // Create Organization Mutation
    const createOrgMutation = useMutation({
        mutationFn: async () => {
            setCreateError(null)
            return await OrganizationService.createOrganization({
                name: newOrgName,
                type: "company" // Hardcoded per existing logic
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] })
            toast.success("Organization created successfully")
            setIsCreateOpen(false)
            setNewOrgName("")
            setNewOrgType("")
            setNewOrgEmployeeCount("")
            setNewOrgStatus("active")
            setCreateError(null)
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to create organization"
            console.error("Failed to create org:", err)
            setCreateError(msg)
            toast.error(msg)
        }
    })

    const handleCreateOrg = async () => {
        createOrgMutation.mutate()
    }

    const handleEditOrg = (org: Organization) => {
        console.log("Updating organization:", org);
        toast.info("Update Organization functionality is not yet fully implemented in Backend.");
    }

    const handleDeleteOrg = (id: string) => {
        toast.info("Delete Organization functionality is not yet fully implemented in Backend.");
    }

    return {
        // Table Data & Pagination
        organizations: data?.items || [],
        pagination: data?.pagination,
        isLoading,
        isError,
        error: error ? error.message : null,

        // URL Pagination Handlers
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'asc' } : null,
        requestSort: setSort,

        // Create
        isCreateOpen,
        setIsCreateOpen,
        newOrgName,
        setNewOrgName,
        newOrgType,
        setNewOrgType,
        newOrgEmployeeCount,
        setNewOrgEmployeeCount,
        newOrgStatus,
        setNewOrgStatus,
        handleCreateOrg,
        isCreating: createOrgMutation.isPending,
        createError,

        // Placeholder actions
        handleEditOrg,
        handleDeleteOrg
    }
}
