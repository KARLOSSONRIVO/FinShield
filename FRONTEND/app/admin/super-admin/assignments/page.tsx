"use client"

import { Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AssignmentTableContent } from "@/components/assignments/AssignmentTable"
import { useAssignments } from "@/hooks/assignments/use-assignments"
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog"
import { AssignmentSortFilter } from "@/components/assignments/AssignmentSortFilter"
import { AssignmentTableSkeleton } from "@/components/skeletons/assignment-table-skeleton"
import { SearchInput } from "@/components/common/SearchInput"

export default function AssignmentsPage() {
  const {
    search,
    setSearch,
    assignments,
    pagination,
    setPage,
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
    companies,
    isLoading // Destructure isLoading
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
        <SearchInput
          value={search || ""}
          onChange={setSearch}
          placeholder="Search Assignments..."
        />
        <AssignmentSortFilter
          sortConfig={sortConfig as any}
          onSortChange={(config) => {
            requestSort(config.key)
          }}
        />
      </div>

      {isLoading ? (
        <AssignmentTableSkeleton />
      ) : (
        <AssignmentTableContent
          assignments={assignments}
          onDelete={handleDeleteAssignment}
          onUpdate={handleUpdateAssignment}
          companies={companies}
          auditors={auditors}
          pagination={pagination}
          onPageChange={setPage}
          sortBy={sortConfig?.key}
          order={sortConfig?.direction as "asc" | "desc" | undefined}
          onSort={(field) => requestSort(field)}
        />
      )}
    </div>
  )
}
