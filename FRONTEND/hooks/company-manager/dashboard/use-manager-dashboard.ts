"use client"

import { useState } from "react"
import { mockInvoices, mockUsers } from "@/lib/mock-data"

export function useManagerDashboard() {
    const companyInvoices = mockInvoices.filter((i) => i.companyOrgId === "org-company-1")
    const companyEmployees = mockUsers.filter((u) => u.orgId === "org-company-1" && u.role === "COMPANY_USER")
    const flaggedInvoices = companyInvoices.filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
    const totalValue = companyInvoices.reduce((sum, inv) => sum + (inv.totals_total || 0), 0)
    const recentInvoices = companyInvoices.slice(-5).reverse()

    const [isLoading, setIsLoading] = useState(true)

    
    const [mounted, setMounted] = useState(false)
    if (!mounted) {
        setTimeout(() => {
            setIsLoading(false)
            setMounted(true)
        }, 1000)
    }

    return {
        companyInvoicesCount: companyInvoices.length,
        flaggedInvoicesCount: flaggedInvoices.length,
        employeeCount: companyEmployees.length,
        totalValue,
        recentInvoices,
        flaggedInvoices,
        isLoading
    }
}
