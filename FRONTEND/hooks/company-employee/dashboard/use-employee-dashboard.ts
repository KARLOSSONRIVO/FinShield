"use client"

import { mockInvoices } from "@/lib/mock-data"

import { useState } from "react"

export function useEmployeeDashboard() {
    // Filter invoices for this specific employee (John Doe - user-employee-1)
    const myInvoices = mockInvoices.filter((i) => i.uploadedByUserId === "user-employee-1")
    const flaggedInvoices = myInvoices.filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
    const pendingInvoices = myInvoices.filter((i) => i.status === "pending")
    const verifiedInvoices = myInvoices.filter((i) => i.status === "verified")
    const totalValue = myInvoices.reduce((sum, inv) => sum + (inv.totals_total || 0), 0)
    const recentInvoices = myInvoices.slice(-5).reverse()

    const [isLoading, setIsLoading] = useState(true)

    // Simulate loading
    const [mounted, setMounted] = useState(false)
    if (!mounted) {
        setTimeout(() => {
            setIsLoading(false)
            setMounted(true)
        }, 1000)
    }

    return {
        myInvoicesCount: myInvoices.length,
        pendingCount: pendingInvoices.length,
        verifiedCount: verifiedInvoices.length,
        flaggedCount: flaggedInvoices.length,
        totalValue,
        recentInvoices,
        flaggedInvoices,
        isLoading
    }
}
