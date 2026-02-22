"use client"

import { Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/users/UserTable"
import { useUsers } from "@/hooks/users/use-users"
import { CreateUserDialog } from "@/components/users/CreateUserDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { UserTableSkeleton } from "@/components/skeletons/user-table-skeleton"
import { CompanyEmployeesTable } from "@/components/users/CompanyEmployeesTable"
import { SearchInput } from "@/components/common/SearchInput"

export default function PlatformUsersPage() {
  const {
    search,
    setSearch,
    users,
    pagination,
    setPage,
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
    roleFilter,
    setRoleFilter,
    isLoading // Destructure isLoading
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
          <SearchInput
            value={search || ""}
            onChange={setSearch}
            placeholder="Search Users..."
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 gap-2 border-2 border-black/10 text-base px-6">
                <Filter className="h-4 w-4" />
                Filter & Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 h-80 overflow-y-auto">
              <DropdownMenuLabel>Filter By Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRoleFilter("")}>
                <span className={roleFilter === null || roleFilter === "" ? "font-bold text-emerald-600" : ""}>All Roles</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('AUDITOR')}>
                <span className={roleFilter === 'AUDITOR' ? "font-bold text-emerald-600" : ""}>Auditor</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('REGULATOR')}>
                <span className={roleFilter === 'REGULATOR' ? "font-bold text-emerald-600" : ""}>Regulator</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRoleFilter('COMPANY_MANAGER')}>
                <span className={roleFilter === 'COMPANY_MANAGER' ? "font-bold text-emerald-600" : ""}>Company Manager</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort By Field</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => requestSort('createdAt', 'desc')}>
                <span className={sortConfig?.key === 'createdAt' && sortConfig.direction === 'desc' ? "font-bold text-emerald-600" : ""}>Date Created (New-Old)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => requestSort('createdAt', 'asc')}>
                <span className={sortConfig?.key === 'createdAt' && sortConfig.direction === 'asc' ? "font-bold text-emerald-600" : ""}>Date Created (Old-New)</span>
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
          onUpdateStatus={handleUpdateStatus}
          pagination={pagination}
          onPageChange={setPage}
          sortBy={sortConfig?.key}
          order={sortConfig?.direction as "asc" | "desc" | undefined}
          onSort={(field) => requestSort(field)}
          renderSubComponent={(user) => {
            if (user.role === 'COMPANY_MANAGER' && user.orgId) {
              return <CompanyEmployeesTable orgId={user.orgId} managerId={user._id} />
            }
            return null
          }}
        />
      )}
    </div>
  )
}
