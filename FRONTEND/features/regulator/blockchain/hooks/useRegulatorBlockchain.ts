"use client"

import { mockInvoices } from "@/lib/mock-data"

export function useRegulatorBlockchain() {
    const verifiedInvoices = mockInvoices.filter((i) => i.blockchain_txHash)

    return {
        verifiedInvoices
    }
}
