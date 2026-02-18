"use client"

import { useState } from "react"
import { mockUsers, mockInvoices } from "@/lib/mock-data"

export function useCompanyEmployees() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    
    const companyEmployees = mockUsers.filter((u) => u.orgId === "org-company-1" && u.role === "COMPANY_USER")

    
    const getInvoiceCount = (userId: string) => {
        return mockInvoices.filter((i) => i.uploadedByUserId === userId).length
    }

    const handleCreateEmployee = () => {
        
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
