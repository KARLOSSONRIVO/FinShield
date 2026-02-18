import { apiClient } from "@/lib/api-client"
import { components } from '@/types/api'

type User = components["schemas"]["User"]
type CreateUserPayload = components["schemas"]["User"] 
type UpdateUserPayload = { status: "ACTIVE" | "INACTIVE" | "SUSPENDED" }





interface CreateUserRequest {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER";
    orgId?: string;
}

export const UserService = {
    listUsers: async () => {
        const { data } = await apiClient.get<{ ok: boolean; data: User[] }>("/user/listUsers")
        return data
    },

    getUser: async (id: string) => {
        const { data } = await apiClient.get<{ ok: boolean; data: User }>(`/user/${id}`)
        return data
    },

    createUser: async (user: CreateUserRequest) => {
        console.log("DEBUG: Creating user with payload:", user)
        const { data } = await apiClient.post<{ ok: boolean; data: User }>("/user/createUser", user)
        return data
    },

    updateUserStatus: async (id: string, status: UpdateUserPayload["status"], reason?: string) => {
        const { data } = await apiClient.put<{ ok: boolean; data: User }>(`/user/updateUser/${id}`, { status, reason })
        return data
    },
}
