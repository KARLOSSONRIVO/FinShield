"use client"

import { useState } from "react"
import { mockUsers, mockInvoices } from "@/lib/mock-data"

export function useCompanyEmployees() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    // Filter employees for this company
    const companyEmployees = mockUsers.filter((u) => u.orgId === "org-company-1" && u.role === "COMPANY_USER")

    // Get invoice count per employee
    const getInvoiceCount = (userId: string) => {
        return mockInvoices.filter((i) => i.uploadedByUserId === userId).length
    }

    const handleCreateEmployee = () => {
        // Logic to create employee would go here
        setIsAddDialogOpen(false)
    }

    return {
        employees: companyEmployees,
        getInvoiceCount,
        isAddDialogOpen,
        setIsAddDialogOpen,
        handleCreateEmployee
    }
}
