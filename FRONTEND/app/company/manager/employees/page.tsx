"use client"

import { Input } from "@/components/ui/input"
import { Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ManagerEmployeeTable } from "@/components/users/ManagerEmployeeTable"
import { useManagerEmployees } from "@/hooks/company-manager/employees/use-manager-employees"
import { AddEmployeeDialog } from "@/components/users/ManagerAddEmployeeDialog"
import { Pagination } from "@/components/ui/pagination-custom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { EmployeeTableSkeleton } from "@/components/skeletons/employee-table-skeleton"

export default function ManagerEmployeesPage() {
  const {
    search,
    setSearch,
    users,
    currentPage,
    totalPages,
    setCurrentPage,
    sortConfig,
    requestSort,
    isCreateOpen,
    setIsCreateOpen,
    newUser,
    setNewUser,
    handleCreateUser,
    setDisableUserId,
    isLoading // Destructure isLoading
  } = useManagerEmployees()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Employees</h2>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create Employee

        </Button>
      </div>

      <AddEmployeeDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateUser}
        newUser={newUser}
        setNewUser={setNewUser}
      />

      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Employees..."
              className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-black/10 text-base px-6">
                <Filter className="h-4 w-4" />
                Filter & Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Sort By Name</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => requestSort('username')}>
                <span className={sortConfig?.key === 'username' && sortConfig.direction === 'asc' ? "font-bold text-primary" : ""}>Ascending (A-Z)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'username' || sortConfig?.direction === 'asc') requestSort('username') }}>
                <span className={sortConfig?.key === 'username' && sortConfig.direction === 'desc' ? "font-bold text-primary" : ""}>Descending (Z-A)</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort By Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => requestSort('status')}>
                <span className={sortConfig?.key === 'status' && sortConfig.direction === 'asc' ? "font-bold text-primary" : ""}>Active First</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'status' || sortConfig?.direction === 'asc') requestSort('status') }}>
                <span className={sortConfig?.key === 'status' && sortConfig.direction === 'desc' ? "font-bold text-primary" : ""}>Inactive First</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <EmployeeTableSkeleton />
      ) : (
        <ManagerEmployeeTable
          users={users}
          sortConfig={sortConfig}
          onSort={requestSort}
          onDisableUser={(id) => setDisableUserId(id)}
        />
      )}

      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div >
  )
}
