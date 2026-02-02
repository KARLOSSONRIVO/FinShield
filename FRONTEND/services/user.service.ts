import { apiClient } from "@/lib/api-client"
import { components } from "@/lib/api-types"

type User = components["schemas"]["User"]
type CreateUserPayload = components["schemas"]["User"] // Actually request body is different
type UpdateUserPayload = { status: "ACTIVE" | "INACTIVE" | "SUSPENDED" }

// Define specific payload based on API types if complex, 
// but for now relying on inference or explicit typing from api-types
// Looking at api-types, createUser body is inline.

interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: "SUPER_ADMIN" | "AUDITOR" | "REGULATOR" | "COMPANY_MANAGER" | "COMPANY_USER";
    organizationId?: string;
}

export const UserService = {
    listUsers: async () => {
        const { data } = await apiClient.get<{ success: boolean; data: User[] }>("/user/listUsers")
        return data
    },

    getUser: async (id: string) => {
        const { data } = await apiClient.get<{ success: boolean; data: User }>(`/user/${id}`)
        return data
    },

    createUser: async (user: CreateUserRequest) => {
        const { data } = await apiClient.post<{ success: boolean; data: User }>("/user/createUser", user)
        return data
    },

    updateUserStatus: async (id: string, status: UpdateUserPayload["status"]) => {
        const { data } = await apiClient.put<{ success: boolean; data: User }>(`/user/updateUser/${id}`, { status })
        return data
    },
}
