import { apiClient } from "@/lib/api-client"

export interface Terms {
    id: string;
    title: string;
    content: string;
    version: string;
    createdByUserId: string;
    updatedByUserId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTermsRequest {
    title: string;
    content: string;
    version?: string;
}

export interface UpdateTermsRequest {
    title?: string;
    content?: string;
    version?: string;
}

export interface GetTermsParams {
    search?: string;
    limit?: number;
    offset?: number;
}

export const termsService = {
    /**
     * Get all terms and conditions
     * @param params Optional search and pagination
     */
    getAllTerms: async (params?: GetTermsParams): Promise<{ ok: boolean; data: Terms[] }> => {
        const { data } = await apiClient.get<{ ok: boolean; data: Terms[] }>("/terms", { params });
        return data;
    },

    /**
     * Create new terms and conditions
     * @param termsData Title, content, optional version
     */
    createTerms: async (termsData: CreateTermsRequest): Promise<{ ok: boolean; message: string; data: Terms }> => {
        const { data } = await apiClient.post<{ ok: boolean; message: string; data: Terms }>("/terms", termsData);
        return data;
    },

    /**
     * Update existing terms and conditions
     * @param id Terms ID
     * @param termsData Fields to update
     */
    updateTerms: async (id: string, termsData: UpdateTermsRequest): Promise<{ ok: boolean; message: string; data: Terms }> => {
        const { data } = await apiClient.patch<{ ok: boolean; message: string; data: Terms }>(`/terms/${id}`, termsData);
        return data;
    },

    /**
     * Delete terms and conditions
     * @param id Terms ID
     */
    deleteTerms: async (id: string): Promise<{ ok: boolean; message: string }> => {
        const { data } = await apiClient.delete<{ ok: boolean; message: string }>(`/terms/${id}`);
        return data;
    }
};