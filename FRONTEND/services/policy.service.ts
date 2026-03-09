import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, PaginationQuery } from "@/lib/types"

export interface Policy {
    id: string;
    _id?: string;
    title: string;
    content: string;
    version: string;
    createdByUserId: string;
    updatedByUserId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePolicyRequest {
    title: string;
    content: string;
    version?: string;
}

export interface UpdatePolicyRequest {
    title?: string;
    content?: string;
    version?: string;
}

export const policyService = {
    /**
     * Get all policies
     */
    getAllPolicies: async (params?: PaginationQuery): Promise<{ ok: boolean; data: Policy[] }> => {
        const { data } = await apiClient.get<{ ok: boolean; data: Policy[] }>("/policy", { params })
        return data
    },

    /**
     * Create a new policy
     */
    createPolicy: async (policyData: CreatePolicyRequest): Promise<{ ok: boolean; message: string; data: Policy }> => {
        const { data } = await apiClient.post<{ ok: boolean; message: string; data: Policy }>("/policy", policyData)
        return data
    },

    /**
     * Update a policy
     */
    updatePolicy: async (id: string, policyData: UpdatePolicyRequest): Promise<{ ok: boolean; message: string; data: Policy }> => {
        const { data } = await apiClient.patch<{ ok: boolean; message: string; data: Policy }>(`/policy/${id}`, policyData)
        return data
    },

    /**
     * Delete a policy
     */
    deletePolicy: async (id: string): Promise<{ ok: boolean; message: string }> => {
        const { data } = await apiClient.delete<{ ok: boolean; message: string }>(`/policy/${id}`)
        return data
    }
}