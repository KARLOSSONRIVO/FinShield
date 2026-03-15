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
    const [newInvoiceTemplate, setNewInvoiceTemplate] = useState<File | null>(null)
    const [newOrgType, setNewOrgType] = useState("organization")
    const [newOrgStatus, setNewOrgStatus] = useState("active")
    const [createError, setCreateError] = useState<string | null>(null)

    // Fetch Organizations
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["organizations", queryParams],
        queryFn: async () => {
            const allowedSortKeys = ["createdAt", "name", "type"]
            const fetchParams = {
                ...queryParams,
                sortBy: (queryParams.sortBy && allowedSortKeys.includes(queryParams.sortBy) ? queryParams.sortBy : undefined) as "name" | "type" | "createdAt" | undefined
            }

            const response = await OrganizationService.listOrganizations(fetchParams)

            // Handle both unified PaginatedResponse or legacy array fallback
            // @ts-ignore
            if (response.data && Array.isArray(response.data)) {
                // Fallback if backend isn't paginated yet
                const rawData = response.data
                return {
                    items: rawData.map((o: any) => ({
                        id: String(o.id || o._id),
                        _id: String(o.id || o._id),
                        name: o.name,
                        type: (o.type || "organization").toLowerCase() as "organization" | "company",
                        status: (o.status || "active").toLowerCase() as "active" | "inactive",
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
                _id: String(o.id || o._id),
                name: o.name,
                type: (o.type || "organization").toLowerCase() as "organization" | "company",
                status: (o.status || "active").toLowerCase() as "active" | "inactive",
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
                type: newOrgType as "organization" | "company",
                invoiceTemplate: newInvoiceTemplate || undefined,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] })
            toast.success("Organization created successfully")
            setIsCreateOpen(false)
            setNewOrgName("")
            setNewOrgType("organization")
            setNewInvoiceTemplate(null)
            setNewOrgStatus("active")
            setCreateError(null)
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Failed to create organization"
            setCreateError(msg)
            toast.error(msg)
        }
    })

    // Update Organization Mutation
    const updateOrgMutation = useMutation({
        mutationFn: async (org: Organization) => {
            const organizationId = org.id || org._id;
            if (!organizationId) {
                throw new Error("Organization ID is required");
            }

            return await OrganizationService.updateOrganization(organizationId, {
                name: org.name,
                status: (org.status || "active").toLowerCase() as "active" | "inactive",
                type: (org.type || "organization").toLowerCase() as "organization" | "company"
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] })
            toast.success("Organization updated successfully")
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Failed to update organization"
            toast.error(msg)
        }
    })

    // Delete Organization Mutation
    const deleteOrgMutation = useMutation({
        mutationFn: async (id: string) => {
            return await OrganizationService.deleteOrganization(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organizations"] })
            toast.success("Organization deleted successfully")
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Failed to delete organization"
            toast.error(msg)
        }
    })

    const handleCreateOrg = async () => {
        if (!newOrgName.trim()) {
            setCreateError("Organization name is required");
            return;
        }
        createOrgMutation.mutate()
    }

    const handleEditOrg = (org: Organization) => {
        updateOrgMutation.mutate(org)
    }

    const handleDeleteOrg = (id: string) => {
        deleteOrgMutation.mutate(id)
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
        newInvoiceTemplate,
        setNewInvoiceTemplate,
        newOrgName,
        setNewOrgName,
        newOrgType,
        setNewOrgType,
        newOrgStatus,
        setNewOrgStatus,
        handleCreateOrg,
        isCreating: createOrgMutation.isPending,
        createError,

        // Update
        isUpdating: updateOrgMutation.isPending,

        // Delete
        isDeleting: deleteOrgMutation.isPending,

        // Actions
        handleEditOrg,
        handleDeleteOrg
    }
}
