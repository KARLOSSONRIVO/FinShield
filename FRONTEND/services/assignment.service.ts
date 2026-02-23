import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, PaginationQuery } from "@/lib/types"

export interface Assignment {
    id: string;
    _id?: string;   // alias
    auditorOrgId: string;
    companyOrgId: string;
    status: "ACTIVE" | "INACTIVE";
    createdAt?: string;
    updatedAt?: string;
    // Populated fields from backend mapper
    company?: { id: string; name: string }
    auditor?: { id: string; username: string; email: string }
    assignedBy?: { id: string; username: string }
}

export interface CreateAssignmentRequest {
    auditorUserId: string;
    companyOrgId: string;
}

export interface UpdateAssignmentRequest {
    status: "ACTIVE" | "INACTIVE";
}

/** Valid sortBy values for GET /assignment/listAssignments */
const VALID_SORT = ['createdAt', 'assignedAt', 'status'] as const

export const AssignmentService = {
    createAssignment: async (payload: CreateAssignmentRequest) => {
        const { data } = await apiClient.post<{ success: boolean; data: Assignment }>("/assignment/createAssignment", payload)
        return data
    },

    listAssignments: async (params?: PaginationQuery) => {
        const cleanParams = params ? { ...params } : {}
        if (cleanParams.sortBy && !VALID_SORT.includes(cleanParams.sortBy as any)) {
            delete cleanParams.sortBy
            delete cleanParams.order
        }
        const { data } = await apiClient.get<PaginatedResponse<Assignment>>("/assignment/listAssignments", { params: cleanParams })
        return data
    },

    getAssignmentById: async (id: string) => {
        const { data } = await apiClient.get<{ success: boolean; data: Assignment }>(`/assignment/${id}`)
        return data
    },

    updateAssignment: async (id: string, payload: UpdateAssignmentRequest) => {
        const { data } = await apiClient.put<{ success: boolean; data: Assignment }>(`/assignment/updateAssignment/${id}`, payload)
        return data
    },

    deleteAssignment: async (id: string) => {
        const { data } = await apiClient.delete<{ success: boolean }>(`/assignment/deleteAssignment/${id}`)
        return data
    }
}
