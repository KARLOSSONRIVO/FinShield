import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, PaginationQuery, User } from "@/lib/types"

interface CreateUserRequest {
    email: string;
    password: string;
    username: string;
    role: "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER";
    orgId?: string;
}

export const UserService = {
    listUsers: async (params?: PaginationQuery & { orgId?: string, sortBy?: 'createdAt' | 'username' | 'email' | 'role' | 'lastLoginAt' }): Promise<PaginatedResponse<User>> => {
        const { data } = await apiClient.get<PaginatedResponse<User>>("/user/listUsers", { params })
        return data
    },

    listEmployees: async (params?: PaginationQuery & { sortBy?: 'createdAt' | 'username' | 'email' }): Promise<PaginatedResponse<User>> => {
        const { data } = await apiClient.get<PaginatedResponse<User>>("/user/listEmployees", { params })
        return data
    },

    getUser: async (id: string): Promise<{ success: boolean; data: User }> => {
        const { data } = await apiClient.get<{ success: boolean; data: User }>(`/user/${id}`)
        return data
    },

    createUser: async (user: CreateUserRequest): Promise<{ success: boolean; data: User }> => {
        const { data } = await apiClient.post<{ success: boolean; data: User }>("/user/createUser", user)
        return data
    },

    updateUserStatus: async (id: string, status: "active" | "disabled", reason?: string): Promise<{ ok: boolean; data: any }> => {
        const { data } = await apiClient.put<{ ok: boolean; data: any }>(`/user/updateUser/${id}`, { status, reason })
        return data
    },
}
