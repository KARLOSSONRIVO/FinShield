import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, PaginationQuery, Organization as CommonOrganization } from "@/lib/types"

export type Organization = CommonOrganization

export type OrganizationStatus = NonNullable<Organization["status"]>

export interface CreateOrganizationRequest {
    name: string;
    type: "company" | "platform";
    invoiceTemplate?: File | string;
}

export interface UpdateOrganizationRequest {
    name?: string;
    status?: "active" | "inactive" | "suspended";
    type?: "company" | "platform";
    invoiceTemplate?: File | string;
}

export const OrganizationService = {
    /**
     * Create a new organization
     * Requires Multipart form data because of invoiceTemplate file upload
     */
    createOrganization: async (data: CreateOrganizationRequest) => {
        const formData = new FormData()
        formData.append("name", data.name)
        formData.append("type", data.type)
        if (data.invoiceTemplate) {
            formData.append("invoiceTemplate", data.invoiceTemplate)
        }

        const { data: response } = await apiClient.post<{ ok: boolean; data: Organization }>(
            "/organization/createOrganization",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        )
        return response
    },

    /**
     * List all organizations
     */
    listOrganizations: async (params?: PaginationQuery & { sortBy?: 'createdAt' | 'name' | 'type' }) => {
        const { data } = await apiClient.get<PaginatedResponse<Organization>>("/organization/listOrganizations", { params })
        return data
    },

    /**
     * Get organization by ID
     */
    getOrganization: async (id: string) => {
        const { data } = await apiClient.get<{ success: boolean; data: Organization }>(`/organization/getOrganization/${id}`)
        return data
    },

    /**
     * Update organization
     */
    updateOrganization: async (id: string, data: UpdateOrganizationRequest) => {
        // Check if we have a file to upload
        const hasFile = data.invoiceTemplate instanceof File;

        let response;

        if (hasFile) {
            // Use multipart/form-data for file upload
            const formData = new FormData();
            if (data.name) formData.append("name", data.name);
            if (data.status) formData.append("status", data.status);
            if (data.type) formData.append("type", data.type);
            if (data.invoiceTemplate) {
                formData.append("invoiceTemplate", data.invoiceTemplate);
            }

            const { data: responseData } = await apiClient.put<{ ok: boolean; data: Organization }>(
                `/organization/updateOrganization/${id}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            response = responseData;
        } else {
            // Use JSON for regular updates
            const { data: responseData } = await apiClient.put<{ ok: boolean; data: Organization }>(
                `/organization/updateOrganization/${id}`,
                data,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            response = responseData;
        }

        return response;
    },

    /**
     * Delete organization
     */
    deleteOrganization: async (id: string) => {
        const { data } = await apiClient.delete<{ ok: boolean; message: string }>(
            `/organization/deleteOrganization/${id}`
        );
        return data;
    }
}