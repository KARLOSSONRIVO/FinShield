import { apiClient } from "@/lib/api-client"

interface LoginRequest {
    email: string
    password: string
}

interface LoginResponse {
    success: boolean
    data: {
        accessToken: string
        refreshToken: string
        user: {
            id: string
            email: string
            role: string
            username: string
            status: string
            mfaEnabled: boolean
        }
    }
}

interface RefreshResponse {
    success: boolean
    data: {
        accessToken: string
        refreshToken: string
    }
}

export const AuthService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const { data } = await apiClient.post<LoginResponse>("/auth/login", credentials)
        return data
    },

    refreshToken: async (refreshToken: string): Promise<RefreshResponse> => {
        const { data } = await apiClient.post<RefreshResponse>("/auth/refresh", { refreshToken })
        return data
    },

    logout: async () => {
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
            await apiClient.post("/auth/logout", { refreshToken })
        }
    },

    getMe: async () => {
        const { data } = await apiClient.get("/auth/me")
        return data
    },

    changePassword: async (payload: { currentPassword: string; newPassword: string }) => {
        const { data } = await apiClient.post("/auth/change-password", payload)
        return data
    },

    // MFA Methods (undocumented but kept)
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
