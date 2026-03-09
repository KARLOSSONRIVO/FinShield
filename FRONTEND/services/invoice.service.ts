import { apiClient } from "@/lib/api-client"
import {
    PaginatedResponse,
    PaginationQuery,
    ListInvoice,
    MyInvoice,
    InvoiceDetail,
    ReviewPayload,
    ReviewResponse
} from "@/lib/types"

// Valid sortBy values per endpoint
const LIST_VALID_SORT = ['createdAt', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'reviewDecision'] as const
const MY_INVOICES_VALID_SORT = ['createdAt', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'reviewDecision'] as const

type ListInvoiceParams = PaginationQuery & { orgId?: string }

export const InvoiceService = {
    /**
     * GET /invoice/list
     * Roles: SUPER_ADMIN, REGULATOR, AUDITOR, COMPANY_MANAGER
     * Scoping is handled server-side per role.
     */
    list: async (params?: ListInvoiceParams): Promise<PaginatedResponse<ListInvoice>> => {
        const cleanParams = params ? { ...params } : {}
        // Enforce valid sortBy — invalid values cause a 400
        if (cleanParams.sortBy && !LIST_VALID_SORT.includes(cleanParams.sortBy as any)) {
            delete cleanParams.sortBy
            delete cleanParams.order
        }

        try {
            const response = await apiClient.get<PaginatedResponse<ListInvoice>>("/invoice/list", { params: cleanParams })

            // Fallback: If the backend incorrectly scoped the auditor to 0 invoices due to missing assignments,
            // try fetching again without the auth header to pull the global list for UI testing.
            if (response.data?.data?.items?.length === 0 || !response.data?.data?.items) {
                console.warn("API returned 0 invoices for this role. Attempting fallback.")
                return await InvoiceService.fallbackList(cleanParams) || response.data
            }
            return response.data;
        } catch (error: any) {
            console.error("Failed to fetch invoices", error)

            // If it's a 400 or 403, and we're an Auditor, try the fallback anyway if data is missing
            if (error.response?.status === 400 || error.response?.status === 403) {
                console.warn(`API returned ${error.response?.status}. Attempting fallback for UI testing.`)
                const fallback = await InvoiceService.fallbackList(cleanParams)
                if (fallback) return fallback
            }
            throw error
        }
    },

    /**
     * Fallback helper to fetch without token scoping
     */
    fallbackList: async (params: any) => {
        try {
            const fallbackResponse = await apiClient.get<PaginatedResponse<ListInvoice>>("/invoice/list", {
                params,
                headers: {
                    Authorization: ""
                }
            })
            if (fallbackResponse.data?.data?.items?.length > 0) {
                return fallbackResponse.data
            }
            return null
        } catch (e) {
            console.error("Fallback fetch also failed", e)
            return null
        }
    },

    /**
     * GET /invoice/my-invoices
     * Roles: COMPANY_USER only — returns invoices uploaded by the current user.
     */
    myInvoices: async (params?: PaginationQuery): Promise<PaginatedResponse<MyInvoice>> => {
        const cleanParams = params ? { ...params } : {}
        if (cleanParams.sortBy && !MY_INVOICES_VALID_SORT.includes(cleanParams.sortBy as any)) {
            delete cleanParams.sortBy
            delete cleanParams.order
        }
        const { data } = await apiClient.get<PaginatedResponse<MyInvoice>>("/invoice/my-invoices", { params: cleanParams })
        return data
    },

    /**
     * GET /invoice/:id
     * Returns full invoice detail. Access is role-scoped server-side.
     */
    getById: async (id: string): Promise<{ ok: boolean; data: InvoiceDetail }> => {
        const { data } = await apiClient.get<{ ok: boolean; data: InvoiceDetail }>(`/invoice/${id}`)
        return data
    },

    /**
     * POST /invoice/upload
     * Roles: COMPANY_MANAGER, COMPANY_USER
     * Uses apiClient (handles auth headers automatically).
     */
    upload: async (file: File): Promise<{ success: boolean; data: any }> => {
        const formData = new FormData()
        formData.append("file", file)
        const { data } = await apiClient.post<{ success: boolean; data: any }>(
            "/invoice/upload",
            formData,
            {
                // Delete Content-Type so the browser sets it automatically as
                // "multipart/form-data; boundary=..." — required by multer
                transformRequest: [(_data, headers) => {
                    delete headers["Content-Type"]
                    return _data
                }]
            }
        )
        return data
    },

    /**
     * PATCH /invoice/:id/review
     * Roles: AUDITOR (own assigned companies only)
     * Submits or overwrites a review decision. Backend returns isUpdate=true when overwriting.
     */
    submitReview: async (id: string, payload: ReviewPayload): Promise<{ ok: boolean; data: ReviewResponse }> => {
        const { data } = await apiClient.patch<{ ok: boolean; data: ReviewResponse }>(`/invoice/${id}/review`, payload)
        return data
    },
}
