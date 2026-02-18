import { apiClient } from "@/lib/api-client"
import { components } from '@/types/api'

export type Organization = components["schemas"]["Organization"]

export type OrganizationStatus = NonNullable<Organization["status"]>

export interface CreateOrganizationRequest {
    name: string;
    type: "company" | "platform";
    invoiceTemplate?: File;
}

export const OrganizationService = {
    
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

    
    listOrganizations: async () => {
        const { data } = await apiClient.get<{ ok: boolean; data: Organization[] }>("/organization/listOrganizations")
        return data
    },

    
    getOrganization: async (id: string) => {
        const { data } = await apiClient.get<{ ok: boolean; data: Organization }>(`/organization/getOrganization/${id}`)
        return data
    }
}
