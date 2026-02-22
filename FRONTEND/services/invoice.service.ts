import axios from "axios"
import { apiClient } from "@/lib/api-client"
import { Invoice, PaginatedResponse, PaginationQuery } from "@/lib/types"
import { blockchainService, BlockchainLedgerItem } from "./blockchain.service"

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
            const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/invoice/upload`, formData, {
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
                data: JSON.stringify(error.response?.data, null, 2), // Make data readable
                headers: error.response?.headers,
                message: error.message
            });
            console.error("Full Backend Error Response:", error.response?.data); // Explicit log
            throw error; // Re-throw for hook to handle
        }
    },

    /**
     * List all blockchain-anchored invoices via GET /blockchain/ledger.
     * Valid sortBy values: anchoredAt, invoiceNumber
     */
    getAll: async (params?: PaginationQuery): Promise<PaginatedResponse<Invoice>> => {
        // Sanitise sortBy — ledger only accepts 'anchoredAt' | 'invoiceNumber'
        const VALID_SORT = ['anchoredAt', 'invoiceNumber']
        const cleanParams = params ? { ...params } : {}
        if (cleanParams.sortBy && !VALID_SORT.includes(cleanParams.sortBy)) {
            delete cleanParams.sortBy
            delete cleanParams.order
        }

        const response = await blockchainService.getLedger(cleanParams)

        const items: Invoice[] = response.data.items.map((item: BlockchainLedgerItem) => ({
            _id: item.id,
            invoiceNo: item.invoiceNumber,
            companyName: item.company,
            txHash: item.transactionHash,
            anchoredAt: item.anchoredAt,
            status: item.status,
        }))

        return {
            ok: response.ok,
            data: {
                items,
                pagination: response.data.pagination
            }
        }
    }
}
