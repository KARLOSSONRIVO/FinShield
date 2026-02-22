"use client"

import { useState } from "react"

export function useEmployeeDashboard() {
    // Filter invoices for this specific employee (John Doe - user-employee-1)
    const myInvoices: any[] = []
    const flaggedInvoices: any[] = []
    const pendingInvoices: any[] = []
    const verifiedInvoices: any[] = []
    const totalValue = 0
    const recentInvoices: any[] = []

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
