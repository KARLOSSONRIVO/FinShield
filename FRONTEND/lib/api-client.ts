import axios from "axios"

const baseURL = process.env.NEXT_PUBLIC_API_URL

export const apiClient = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
    },
    withCredentials: true, // For cookies
})

// Request Interceptor: Attach Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token")
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response Interceptor: Handle Errors & Token Refresh
interface QueueItem {
    resolve: (value?: unknown) => void
    reject: (error: unknown) => void
}

let isRefreshing = false
let failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

// Auth endpoints that should NEVER trigger a token refresh cycle
const AUTH_ENDPOINTS = ["/auth/login", "/auth/refresh", "/auth/logout"]

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Skip refresh logic entirely for auth endpoints or non-401 errors
        const isAuthEndpoint = AUTH_ENDPOINTS.some((ep) =>
            originalRequest?.url?.includes(ep)
        )

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers["Authorization"] = `Bearer ${token}`
                        return apiClient(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const refreshToken = localStorage.getItem("refreshToken")

                if (!refreshToken) {
                    throw new Error("No refresh token available")
                }

                const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken })
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data

                if (!newAccessToken) {
                    throw new Error("Refresh failed - no new access token")
                }

                localStorage.setItem("token", newAccessToken)
                if (newRefreshToken) {
                    localStorage.setItem("refreshToken", newRefreshToken)
                }

                apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`
                originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`

                processQueue(null, newAccessToken)
                return apiClient(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                localStorage.removeItem("token")
                localStorage.removeItem("refreshToken")
                localStorage.removeItem("user")
                document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

                // Only redirect if we're not already on the login page
                if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
                    window.location.href = "/login"
                }

                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)
