import { apiClient } from "@/lib/api-client"
import { mockInvoices } from "@/lib/mock-data"
// import { components } from "@/lib/api-types" // API types are missing Invoice schemas in paths?
import { Invoice } from "@/lib/types" // Using Frontend ID for now since API types differ or are missing

export const InvoiceService = {
    /**
     * Upload an invoice file
     * Note: Backend currently only accepts the file and ignores metadata in the request body.
     */
    upload: async (payload: { file: File }) => {
        const formData = new FormData()
        formData.append("file", payload.file)

        // Frontend collects these, but backend doesn't read them yet.
        // formData.append("invoiceNo", payload.invoiceNo) 
        // formData.append("amount", payload.amount)

        const { data } = await apiClient.post("/invoice/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        })
        return data
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
