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
    login: (credentials: LoginRequest) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Initialize auth state
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("token")
            if (token) {
                try {
                    // If we have a stored user in local storage, use it initially for speed
                    // Ideally, we might want to validate the token with a /me endpoint here
                    const storedUser = localStorage.getItem("user")
                    if (storedUser) {
                        setUser(JSON.parse(storedUser))
                    }
                } catch (error) {
                    console.error("Failed to parse stored user", error)
                    localStorage.removeItem("token")
                    localStorage.removeItem("user")
                }
            }
            setIsLoading(false)
        }

        initializeAuth()
    }, [])

    const login = async (credentials: LoginRequest) => {
        setIsLoading(true)
        try {
            const response = await AuthService.login(credentials)

            const success = response.success || (response as any).ok

            if (success) {
                // Handle variations in response structure as seen in original code
                const data = response.data as any
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

                    // Redirect based on role
                    navigateBasedOnRole(userData)
                } else {
                    throw new Error("Invalid response structure from server")
                }
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
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
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
