"use client"

import { Input } from "@/components/ui/input"
import { Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssignmentTableContent } from "@/components/assignments/AssignmentTable"
import { useAssignments } from "@/hooks/assignments/use-assignments"
import { Pagination } from "@/components/ui/pagination-custom"
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog"
import { AssignmentSortFilter } from "@/components/assignments/AssignmentSortFilter"

export default function AssignmentsPage() {
  const {
    search,
    setSearch,
    assignments,
    currentPage,
    totalPages,
    setCurrentPage,
    sortConfig,
    requestSort,
    isCreateOpen,
    setIsCreateOpen,
    newAssignment,
    setNewAssignment,
    handleCreateAssignment,
    handleDeleteAssignment,
    handleUpdateAssignment,
    auditors,
    companies
  } = useAssignments()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Auditor Assignments</h2>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Auditor
        </Button>
      </div>

      <CreateAssignmentDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        newAssignment={newAssignment}
        setNewAssignment={setNewAssignment}
        auditors={auditors}
        companies={companies}
        onCreateAssignment={handleCreateAssignment}
      />

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Assignments..."
            className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <AssignmentSortFilter
          sortConfig={sortConfig as any}
          onSortChange={(config) => {
            requestSort(config.key)
          }}
        />
      </div>

      <AssignmentTableContent
        assignments={assignments}
        sortConfig={sortConfig}
        onSort={requestSort}
        onDelete={handleDeleteAssignment}
        onUpdate={handleUpdateAssignment}
        companies={companies}
        auditors={auditors}
      />

      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
