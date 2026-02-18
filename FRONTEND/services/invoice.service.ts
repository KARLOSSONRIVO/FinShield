import { apiClient } from "@/lib/api-client"
import { mockInvoices } from "@/lib/mock-data"
import { Invoice } from '@/types'

export const InvoiceService = {

    upload: async (payload: { file: File }): Promise<Invoice> => {
        const formData = new FormData()
        formData.append("file", payload.file)

        try {
            const { data } = await apiClient.post("/invoice/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })

            const backendInvoice = data.data;
            return {
                ...backendInvoice,

                companyOrgId: backendInvoice.orgId,
                ai_verdict: backendInvoice.aiVerdict,
                ai_riskScore: backendInvoice.aiRiskScore || 0,
                totals_total: backendInvoice.totalAmount || 0,

                blockchain_txHash: backendInvoice.anchorTxHash,
                blockchain_anchoredAt: backendInvoice.anchoredAt,

                invoiceNo: backendInvoice.invoiceNo || "N/A",
                status: backendInvoice.status || "pending"
            } as Invoice;
        } catch (error: any) {
            console.error("Upload Error Details:", {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
                message: error.message
            });
            throw error;
        }
    },

    getAll: async (): Promise<Invoice[]> => {
        await new Promise((resolve) => setTimeout(resolve, 800))
        return mockInvoices
    },

    getById: async (id: string): Promise<Invoice | undefined> => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return mockInvoices.find(inv => inv._id === id)
    }
}
