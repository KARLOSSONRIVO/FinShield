import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, PaginationQuery } from "@/lib/types"

export interface Assignment {
    id: string;
    auditorOrgId: string;
    companyOrgId: string;
    status: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateAssignmentRequest {
    auditorUserId: string;
    companyOrgId: string;
    status?: string;
}

export interface UpdateAssignmentRequest {
    status?: "active" | "inactive" | "ACTIVE" | "INACTIVE";
    notes?: string;
}

export const AssignmentService = {
    /**
     * Create a new assignment
     */
    createAssignment: async (payload: CreateAssignmentRequest) => {
        const { data } = await apiClient.post<{ success: boolean; data: Assignment }>("/assignment/createAssignment", payload)
        return data
    },

    /**
     * List all assignments
     */
    listAssignments: async (params?: PaginationQuery) => {
        const { data } = await apiClient.get<PaginatedResponse<Assignment>>("/assignment/listAssignments", { params })
        return data
    },

    /**
     * Get assignment by ID
     */
    getAssignmentById: async (id: string) => {
        const { data } = await apiClient.get<{ success: boolean; data: Assignment }>(`/assignment/${id}`)
        return data
    },

    /**
     * Update assignment
     */
    updateAssignment: async (id: string, payload: UpdateAssignmentRequest) => {
        const { data } = await apiClient.put<{ success: boolean; data: Assignment }>(`/assignment/updateAssignment/${id}`, payload)
        return data
    },

    /**
     * Delete assignment
     */
    deleteAssignment: async (id: string) => {
        const { data } = await apiClient.delete<{ success: boolean }>(`/assignment/deleteAssignment/${id}`)
        return data
    }
}
