import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, AuditLog, AuditLogQuery } from "@/lib/types"

export const AuditService = {
    /**
     * Fetch audit logs. Only works for SUPER_ADMIN.
     * Hard-codes sortBy to createdAt as per requirements.
     */
    getLogs: async (params?: AuditLogQuery): Promise<PaginatedResponse<AuditLog>> => {
        const cleanParams = params ? { ...params } : {}

        // Force sortBy to createdAt and remove it from the query since it's the only supported one
        if (cleanParams.sortBy) {
            delete cleanParams.sortBy;
        }

        const { data } = await apiClient.get<PaginatedResponse<AuditLog>>("/audit-logs", { params: cleanParams })
        return data
    },

    /**
     * Get details for a specific audit log by ID
     */
    getLogById: async (id: string): Promise<{ ok: boolean; data: AuditLog }> => {
        const { data } = await apiClient.get<{ ok: boolean; data: AuditLog }>(`/audit-logs/${id}`)
        return data
    }
}
