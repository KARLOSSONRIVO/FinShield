import { apiClient } from "@/lib/api-client"
import { PaginatedResponse, PaginationQuery, Organization as CommonOrganization } from "@/lib/types"

export type Organization = CommonOrganization

export type OrganizationStatus = NonNullable<Organization["status"]>

export interface CreateOrganizationRequest {
    name: string;
    type: "company" | "platform";
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
    listOrganizations: async (params?: PaginationQuery) => {
        const { data } = await apiClient.get<PaginatedResponse<Organization>>("/organization/listOrganizations", { params })
        return data
    },

    /**
     * Get organization by ID
     */
    getOrganization: async (id: string) => {
        const { data } = await apiClient.get<{ success: boolean; data: Organization }>(`/organization/getOrganization/${id}`)
        return data
    }
}
