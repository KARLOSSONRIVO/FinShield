import { useState, useMemo } from "react"
import { mockAssignments, mockUsers, mockOrganizations } from "@/lib/mock-data"
import { CompanyAssignment } from "@/lib/types"

export type SortConfig = {
    key: keyof CompanyAssignment | "companyName" | "auditorName"
    direction: "asc" | "desc"
} | null

export function useAssignments() {
    const [search, setSearch] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newAssignment, setNewAssignment] = useState({ company: "", auditor: "", notes: "", taskName: "", dueDate: new Date() })

    // Pagination & Sort
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(5)
    const [sortConfig, setSortConfig] = useState<SortConfig>(null)

    // Helper to join data - AGGREGATED BY AUDITOR
    const aggregatedAuditorRows = useMemo(() => {
        const auditors = mockUsers.filter(u => u.role === "AUDITOR")

        return auditors.map(auditor => {
            // Get all assignments for this auditor
            const auditorAssignments = mockAssignments.filter(a => a.auditorUserId === auditor._id)

            // Find most recent ACTIVE assignment
            // If no active, maybe show most recent inactive? 
            // User said: "get the most recent one in the unfinished pile" (Unfinished = Active)
            const activeAssignments = auditorAssignments.filter(a => a.status === 'active')

            // Sort by assignedAt descending (newest first)
            activeAssignments.sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())

            const latestActive = activeAssignments[0]

            let companyName = "N/A"
            let taskName = "N/A"
            let status = "Idle"
            let dueDate = new Date() // Placeholder, or null? needs to be Date object for Table

            if (latestActive) {
                const company = mockOrganizations.find(o => o._id === latestActive.companyOrgId)
                companyName = company ? company.name : "Unknown Company"
                taskName = latestActive.taskName
                status = latestActive.status
                dueDate = latestActive.dueDate
            }

            return {
                _id: auditor._id, // Row Key
                auditorName: auditor.username, // For Link
                companyName,
                taskName,
                status,
                dueDate
            }
        })
    }, [])

    // Sort Handler
    const requestSort = (key: keyof CompanyAssignment | "companyName" | "auditorName") => {
        let direction: "asc" | "desc" = "asc"
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc"
        }
        setSortConfig({ key, direction })
    }

    const filteredAndSortedAssignments = useMemo(() => {
        let processed = [...aggregatedAuditorRows]

        // Filter
        if (search) {
            processed = processed.filter(a =>
                a.companyName.toLowerCase().includes(search.toLowerCase()) ||
                a.auditorName.toLowerCase().includes(search.toLowerCase()) ||
                a.taskName.toLowerCase().includes(search.toLowerCase())
            )
        }

        // Sort
        if (sortConfig) {
            processed.sort((a, b) => {
                // @ts-ignore
                const aValue = a[sortConfig.key] || "";
                // @ts-ignore
                const bValue = b[sortConfig.key] || "";

                if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
                return 0
            })
        }

        return processed
    }, [aggregatedAuditorRows, search, sortConfig])

    // Pagination
    const totalPages = Math.ceil(filteredAndSortedAssignments.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const currentAssignments = filteredAndSortedAssignments.slice(startIndex, startIndex + itemsPerPage)

    const handleCreateAssignment = () => {
        alert("Assignment logic would go here")
        setIsCreateOpen(false)
    }

    const handleDeleteAssignment = (id: string) => {
        alert(`Deleting assignment ${id} (Mock)`)
    }

    return {
        search,
        setSearch,
        isCreateOpen,
        setIsCreateOpen,
        newAssignment,
        setNewAssignment,
        handleCreateAssignment,
        handleDeleteAssignment,

        assignments: currentAssignments,
        currentPage,
        totalPages,
        setCurrentPage,
        sortConfig,
        requestSort,

        auditors: mockUsers.filter(u => u.role === "AUDITOR"),
        companies: mockOrganizations.filter(o => o.type === "company")
    }
}
