import { apiClient } from "@/lib/api-client"
import { components } from "@/lib/api-types"

export type Organization = components["schemas"]["Organization"]

export type OrganizationStatus = NonNullable<Organization["status"]>

export interface CreateOrganizationRequest {
    name: string;
    type: "company" | "platform";
    invoiceTemplate?: File;
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
    listOrganizations: async () => {
        const { data } = await apiClient.get<{ ok: boolean; data: Organization[] }>("/organization/listOrganizations")
        return data
    },

    /**
     * Get organization by ID
     */
    getOrganization: async (id: string) => {
        const { data } = await apiClient.get<{ ok: boolean; data: Organization }>(`/organization/getOrganization/${id}`)
        return data
    }
}
