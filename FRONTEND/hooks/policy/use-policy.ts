"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { policyService, Policy, CreatePolicyRequest, UpdatePolicyRequest } from "@/services/policy.service"
import { toast } from "sonner"
import { useUrlPagination } from "../common/use-url-pagination"

export function usePolicy(initialLimit = 20) {
    const queryClient = useQueryClient()
    const {
        page, limit, search, sortBy, order, queryParams,
        setPage, setSearch, setSort
    } = useUrlPagination(initialLimit)

    // Fetch all policies
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["policies", queryParams],
        queryFn: async () => {
            const response = await policyService.getAllPolicies(queryParams)
            return {
                items: response.data || [],
                pagination: { total: response.data.length, page: 1, limit: response.data.length, totalPages: 1 }
            }
        }
    })

    // Create policy mutation
    const createPolicyMutation = useMutation({
        mutationFn: async (policyData: CreatePolicyRequest) => {
            // Validate required fields
            if (!policyData.title || policyData.title.length < 3) {
                throw new Error("Title must be at least 3 characters")
            }
            if (!policyData.content || policyData.content.length < 10) {
                throw new Error("Content must be at least 10 characters")
            }
            return await policyService.createPolicy(policyData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] })
            toast.success("Policy created successfully")
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to create policy"
            toast.error(msg)
        }
    })

    // Update policy mutation
    const updatePolicyMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdatePolicyRequest }) => {
            // Validate if fields are provided
            if (data.title && data.title.length < 3) {
                throw new Error("Title must be at least 3 characters")
            }
            if (data.content && data.content.length < 10) {
                throw new Error("Content must be at least 10 characters")
            }
            return await policyService.updatePolicy(id, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] })
            toast.success("Policy updated successfully")
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to update policy"
            toast.error(msg)
        }
    })

    // Delete policy mutation
    const deletePolicyMutation = useMutation({
        mutationFn: async (id: string) => {
            return await policyService.deletePolicy(id)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["policies"] })
            toast.success("Policy deleted successfully")
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || "Failed to delete policy"
            toast.error(msg)
        }
    })

    const handleCreatePolicy = (policyData: CreatePolicyRequest) => {
        createPolicyMutation.mutate(policyData)
    }

    const handleUpdatePolicy = (id: string, data: UpdatePolicyRequest) => {
        updatePolicyMutation.mutate({ id, data })
    }

    const handleDeletePolicy = (id: string) => {
        if (window.confirm("Are you sure you want to delete this policy? This action cannot be undone.")) {
            deletePolicyMutation.mutate(id)
        }
    }

    return {
        // Data
        policies: data?.items || [],
        pagination: data?.pagination,
        isLoading,
        isError,
        error: error ? error.message : null,

        // URL Pagination
        search,
        setSearch,
        setPage,
        sortConfig: sortBy ? { key: sortBy, direction: order || 'asc' } : null,
        requestSort: setSort,

        // Mutations
        createPolicy: handleCreatePolicy,
        updatePolicy: handleUpdatePolicy,
        deletePolicy: handleDeletePolicy,
        isCreating: createPolicyMutation.isPending,
        isUpdating: updatePolicyMutation.isPending,
        isDeleting: deletePolicyMutation.isPending,
    }
}