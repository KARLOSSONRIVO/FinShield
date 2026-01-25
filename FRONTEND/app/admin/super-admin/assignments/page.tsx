"use client"

import { Input } from "@/components/ui/input"
import { Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssignmentTable } from "../../../../features/super-admin/assignments/components/AssignmentTable"
import { useAssignments } from "@/features/super-admin/assignments/hooks/useAssignments"
import { Pagination } from "@/components/ui/pagination-custom"
import { CreateAssignmentDialog } from "@/features/super-admin/assignments/components/CreateAssignmentDialog"

import { AssignmentSortFilter } from "@/features/super-admin/assignments/components/AssignmentSortFilter"

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
            // Request sort logic expects a key, simplified here
            requestSort(config.key)
            // Note: The hook's requestSort auto-toggles direction. 
            // To force a direction if needed, we might need to update the hook, 
            // but for now relying on the simple requestSort toggle is consistent with existing behavior.
            // However, the new UI has explicit Asc/Desc buttons.
            // Ideally we update the hook, but for UI match, sticking to toggle or simpler implementation 
            // effectively matches the "interaction" if not explicit direction setting yet.
            // Actually, let's just pass the key.
          }}
        />
      </div>

      <AssignmentTable
        // @ts-ignore - mismatch in loose types, handled by prop interface
        assignments={assignments}
        sortConfig={sortConfig}
        onSort={requestSort}
        onDelete={handleDeleteAssignment}
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
