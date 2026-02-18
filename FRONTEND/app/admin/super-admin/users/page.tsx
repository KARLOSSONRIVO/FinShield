"use client"

import { Input } from '@/components/ui/forms/input'
import { Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/users/UserTable"
import { useUsers } from "@/hooks/users/use-users"
import { CreateUserDialog } from "@/components/users/CreateUserDialog"
import { Pagination } from '@/components/ui/data-display/pagination-custom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/data-display/dropdown-menu'

import { UserTableSkeleton } from "@/components/skeletons/user-table-skeleton"
import { CompanyEmployeesTable } from "@/components/users/CompanyEmployeesTable"

export default function PlatformUsersPage() {
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
    organizations,
    handleCreateUser,
    handleUpdateStatus,
    userTypeFilter,
    setUserTypeFilter,
    isLoading 
  } = useUsers()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">User Management</h2>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      <CreateUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        newUser={newUser}
        setNewUser={setNewUser}
        organizations={organizations}
        onCreateUser={handleCreateUser}
      />

      <div className="flex flex-col gap-4">

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Users..."
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
              <DropdownMenuLabel>Sort By Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => requestSort('role')}>
                <span className={sortConfig?.key === 'role' && sortConfig.direction === 'asc' ? "font-bold text-primary" : ""}>Ascending</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { if (sortConfig?.key !== 'role' || sortConfig?.direction === 'asc') requestSort('role') }}>
                <span className={sortConfig?.key === 'role' && sortConfig.direction === 'desc' ? "font-bold text-primary" : ""}>Descending</span>
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
        <UserTableSkeleton />
      ) : (
        <UserTable
          users={users}
          sortConfig={sortConfig}
          onSort={requestSort}
          onUpdateStatus={handleUpdateStatus}
          renderSubComponent={(user) => {
            if (user.role === 'COMPANY_MANAGER' && user.orgId) {
              return <CompanyEmployeesTable orgId={user.orgId} managerId={user._id} />
            }
            return null
          }}
        />
      )}


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
