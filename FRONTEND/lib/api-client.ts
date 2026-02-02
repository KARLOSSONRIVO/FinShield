import axios from "axios"

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const apiClient = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
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

// Response Interceptor: Handle Errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect (optional)
            // localStorage.removeItem("token")
            // window.location.href = "/login"
        }
        return Promise.reject(error)
    }
)
