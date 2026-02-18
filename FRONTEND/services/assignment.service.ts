import { apiClient } from "@/lib/api-client"
import { components } from '@/types/api'

export type Assignment = components["schemas"]["Assignment"]

export interface CreateAssignmentRequest {
    auditorUserId: string;
    companyOrgId: string;
    status: string;
}

export interface UpdateAssignmentRequest {
    status?: "active" | "inactive";
    notes?: string;
}

export const AssignmentService = {
    
    createAssignment: async (payload: CreateAssignmentRequest) => {
        const { data } = await apiClient.post<{ ok: boolean; data: Assignment }>("/assignment/createAssignment", payload)
        return data
    },

    
    listAssignments: async () => {
        const { data } = await apiClient.get<{ ok: boolean; data: Assignment[] }>("/assignment/listAssignments")
        return data
    },

    
    getAssignmentById: async (id: string) => {
        const { data } = await apiClient.get<{ ok: boolean; data: Assignment }>(`/assignment/${id}`)
        return data
    },

    
    updateAssignment: async (id: string, payload: UpdateAssignmentRequest) => {
        const { data } = await apiClient.put<{ ok: boolean; data: Assignment }>(`/assignment/updateAssignment/${id}`, payload)
        return data
    },

    
    deleteAssignment: async (id: string) => {
        const { data } = await apiClient.delete<{ ok: boolean }>(`/assignment/deleteAssignment/${id}`)
        return data
    }
}
