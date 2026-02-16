import { apiClient } from "@/lib/api-client"
import { paths } from "@/lib/api-types"

type LoginRequest = paths["/auth/login"]["post"]["requestBody"]["content"]["application/json"]
type LoginResponse = paths["/auth/login"]["post"]["responses"]["200"]["content"]["application/json"]

export const AuthService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const { data } = await apiClient.post<LoginResponse>("/auth/login", credentials)
        return data
    },

    logout: async () => {
        // We might need the refresh token from storage if the API requires it, 
        // but for now we'll just hit the endpoint if needed or simply clear client state.
        // The API definition says it takes a refreshToken in the body.
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
            await apiClient.post("/auth/logout", { refreshToken })
        }
    },

    changePassword: async (payload: { currentPassword?: string; newPassword: string }) => {
        const { data } = await apiClient.post("/auth/change-password", payload)
        return data
    },

    // MFA Methods
    verifyMfa: async (payload: { tempToken: string; token: string }) => {
        const { data } = await apiClient.post("/auth/login/mfa", payload)
        return data
    },

    setupMfa: async () => {
        const { data } = await apiClient.post("/auth/mfa/setup")
        return data
    },

    enableMfa: async (payload: { token: string }) => {
        const { data } = await apiClient.post("/auth/mfa/enable", payload)
        return data
    },

    disableMfa: async (payload: { password: string }) => {
        const { data } = await apiClient.post("/auth/mfa/disable", payload)
        return data
    }
}
