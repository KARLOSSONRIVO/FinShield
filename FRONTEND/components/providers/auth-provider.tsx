"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/services/auth.service"
import type { components } from "@/lib/api-types"

type User = components["schemas"]["User"]
type LoginRequest = Parameters<typeof AuthService.login>[0]

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (credentials: LoginRequest) => Promise<any>
    logout: () => Promise<void>
    verifyMfaLogin: (tempToken: string, token: string) => Promise<void>
    enableMfa: (token: string) => Promise<void>
    disableMfa: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Initialize auth state — validates token against API, not just localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                setIsLoading(false)
                return
            }
            try {
                // Validate the stored token by calling /auth/me
                const response = await AuthService.getMe()
                const userData = response?.data?.user || response?.data || response?.user
                if (userData) {
                    setUser(userData)
                    localStorage.setItem("user", JSON.stringify(userData))
                } else {
                    throw new Error("Invalid user data from /auth/me")
                }
            } catch (error) {
                // Token is expired or invalid — clear everything so user stays on /login
                console.warn("Token validation failed, clearing session:", error)
                localStorage.removeItem("token")
                localStorage.removeItem("refreshToken")
                localStorage.removeItem("user")
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()
    }, [])

    const handleAuthSuccess = (data: any) => {
        const userData = data?.user || (data?.data && data.data.user)
        const accessToken = data?.accessToken || (data?.data && data.data.accessToken)
        const refreshToken = data?.refreshToken || (data?.data && data.data.refreshToken)

        if (accessToken && userData) {
            localStorage.setItem("token", accessToken)
            localStorage.setItem("user", JSON.stringify(userData))
            if (refreshToken) {
                localStorage.setItem("refreshToken", refreshToken)
            }

            // Set cookie for middleware
            document.cookie = `token=${accessToken}; path=/; max-age=86400; SameSite=Strict`

            setUser(userData)
            navigateBasedOnRole(userData)
        } else {
            throw new Error("Invalid response structure from server")
        }
    }

    const login = async (credentials: LoginRequest) => {
        setIsLoading(true)
        try {
            const response: any = await AuthService.login(credentials)
            // Check if MFA is required
            if (response.data?.mfaRequired || response.mfaRequired) {
                setIsLoading(false) // Stop loading so UI can show MFA input
                return {
                    mfaRequired: true,
                    tempToken: response.data?.tempToken || response.tempToken
                }
            }

            const success = response.success || response.ok || (response.data && (response.data.accessToken || response.data.user))

            if (success) {
                handleAuthSuccess(response)
                return { success: true }
            } else {
                throw new Error("Login failed")
            }
        } catch (error) {
            console.error("Login error:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const verifyMfaLogin = async (tempToken: string, token: string) => {
        setIsLoading(true)
        try {
            const response = await AuthService.verifyMfa({ tempToken, token })
            handleAuthSuccess(response)
        } catch (error) {
            console.error("MFA Verify error:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const enableMfa = async (token: string) => {
        try {
            await AuthService.enableMfa({ token })
            if (user) {
                const updatedUser = { ...user, mfaEnabled: true }
                setUser(updatedUser)
                localStorage.setItem("user", JSON.stringify(updatedUser))
            }
        } catch (error) {
            throw error
        }
    }

    const disableMfa = async (password: string) => {
        try {
            await AuthService.disableMfa({ password })
            if (user) {
                const updatedUser = { ...user, mfaEnabled: false }
                setUser(updatedUser)
                localStorage.setItem("user", JSON.stringify(updatedUser))
            }
        } catch (error) {
            throw error
        }
    }

    const logout = async () => {
        try {
            await AuthService.logout()
        } catch (error) {
            console.error("Logout error", error)
        } finally {
            localStorage.removeItem("token")
            localStorage.removeItem("refreshToken")
            localStorage.removeItem("user")

            // Remove cookie
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

            setUser(null)
            router.push("/login")
        }
    }

    const navigateBasedOnRole = (user: User) => {
        if (user.mustChangePassword) {
            router.push("/auth/change-password")
            return
        }

        switch (user.role) {
            case "SUPER_ADMIN":
                router.push("/admin/super-admin")
                break
            case "AUDITOR":
                router.push("/admin/auditor")
                break
            case "REGULATOR":
                router.push("/admin/regulator")
                break
            case "COMPANY_MANAGER":
                router.push("/company/manager")
                break
            case "COMPANY_USER":
                router.push("/company/employee")
                break
            default:
                router.push("/")
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            verifyMfaLogin,
            enableMfa,
            disableMfa
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider")
    }
    return context
}
