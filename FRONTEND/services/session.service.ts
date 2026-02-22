import { apiClient as api } from '@/lib/api-client'

export interface SessionItem {
    id: string
    userId: string
    userAgent: string
    createdAt: string
    expiresAt: string
}

export const sessionService = {
    listActiveSessions: async (): Promise<{ success: boolean; data: SessionItem[] }> => {
        const response = await api.get('/session')
        return response.data
    },

    getSessionCount: async (): Promise<{ success: boolean; data: { count: number } }> => {
        const response = await api.get('/session/count')
        return response.data
    },

    revokeAllSessions: async (): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete('/session/all')
        return response.data
    },

    revokeSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/session/${sessionId}`)
        return response.data
    }
}
