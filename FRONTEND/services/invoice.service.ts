import axios from "axios"
import { apiClient } from "@/lib/api-client"
import { mockInvoices } from "@/lib/mock-data"
// import { components } from "@/lib/api-types" // API types are missing Invoice schemas in paths?
import { Invoice } from "@/lib/types" // Using Frontend ID for now since API types differ or are missing

export const InvoiceService = {
    /**
     * Upload an invoice file
     * The backend handles IPFS anchoring automatically.
     */
    upload: async (payload: { file: File }): Promise<Invoice> => {
        const formData = new FormData()
        formData.append("file", payload.file)

        // Get token manually since we are bypassing apiClient
        const token = localStorage.getItem("token")

        try {
            // Use raw axios to avoid apiClient's default 'application/json' header
            // and let the browser set the correct multipart boundary
            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/invoice/upload`, formData, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    // Do NOT set Content-Type here; let browser handle it
                }
            })

            // Map backend response to frontend Invoice type
            const backendInvoice = data.data;
            return {
                ...backendInvoice,
                // Map mismatched fields
                companyOrgId: backendInvoice.orgId, // Backend uses orgId
                ai_verdict: backendInvoice.aiVerdict, // Backend uses aiVerdict
                ai_riskScore: backendInvoice.aiRiskScore || 0, // Backend uses aiRiskScore
                totals_total: backendInvoice.totalAmount || 0, // Backend uses totalAmount

                // Map blockchain fields
                blockchain_txHash: backendInvoice.anchorTxHash,
                blockchain_anchoredAt: backendInvoice.anchoredAt,

                // Allow frontend only fields to be undefined or defaults
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
            throw error; // Re-throw for hook to handle
        }
    },

    /**
     * List invoices
     * Note: Backend endpoint /invoice/list does not exist yet.
     * Returning mock data to allow frontend development.
     */
    getAll: async (): Promise<Invoice[]> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800))
        return mockInvoices
    },

    /**
     * Get invoice by ID
     */
    getById: async (id: string): Promise<Invoice | undefined> => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        return mockInvoices.find(inv => inv._id === id)
    }
}
