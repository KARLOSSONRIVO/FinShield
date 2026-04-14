'use client'

import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

import { AuditLogTable } from "@/components/audit-logs/AuditLogTable"
import { AuditLogTableSkeleton } from "@/components/skeletons/audit-log-table-skeleton"
import { useAuditLogs } from "@/hooks/audit/use-super-admin-audit-logs"
import { Pagination } from "@/components/ui/pagination-custom"
import { SearchInput } from "@/components/common/SearchInput"
import { AuditActions } from "@/lib/types"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// Helper values for filtering definitions
const ROLES = ["SUPER_ADMIN", "COMPANY_MANAGER", "COMPANY_USER", "AUDITOR", "REGULATOR"]
const ACTIONS = Object.values(AuditActions)

const ACTION_GROUPS = {
  "Authentication": [AuditActions.LOGIN_SUCCESS, AuditActions.ACCOUNT_LOCKED, AuditActions.LOGOUT],
  "MFA": [AuditActions.MFA_ENABLED, AuditActions.MFA_DISABLED],
  "User Management": [AuditActions.USER_CREATED, AuditActions.USER_UPDATED, AuditActions.USER_DISABLED, AuditActions.USER_ENABLED, AuditActions.PASSWORD_RESET_FORCED],
  "Organization": [AuditActions.ORG_CREATED, AuditActions.ORG_TEMPLATE_UPLOADED],
  "Assignments": [AuditActions.ASSIGNMENT_CREATED, AuditActions.ASSIGNMENT_UPDATED, AuditActions.ASSIGNMENT_DELETED],
  "Invoices": [AuditActions.INVOICE_UPLOADED, AuditActions.INVOICE_FLAGGED],
  "Reviews": [AuditActions.REVIEW_SUBMITTED, AuditActions.REVIEW_UPDATED],
  "Policies": [AuditActions.POLICY_CREATED, AuditActions.POLICY_UPDATED, AuditActions.POLICY_DELETED],
  "Terms and Conditions": [AuditActions.TERMS_CREATED, AuditActions.TERMS_UPDATED, AuditActions.TERMS_DELETED],
  "Archival": [AuditActions.ARCHIVE_EXECUTED, AuditActions.ARCHIVE_ACCESSED]
}

export default function AuditLogsPage() {
  const {
    search,
    setSearch,
    action,
    actorRole,
    setFilter,
    setFilters,
    auditLogs,
    pagination,
    setPage,
    isLoading,
    sortConfig,
    requestSort
  } = useAuditLogs()

  const FilterActionItem = ({ val }: { val: string }) => (
    <DropdownMenuCheckboxItem
      checked={action === val}
      onCheckedChange={() => setFilter("action", action === val ? null : val)}
      className="text-xs"
    >
      {val.replace(/_/g, " ")}
    </DropdownMenuCheckboxItem>
  )

  const FilterRoleItem = ({ val }: { val: string }) => (
    <DropdownMenuCheckboxItem
      checked={actorRole === val}
      onCheckedChange={() => setFilter("actorRole", actorRole === val ? null : val)}
      className="text-xs"
    >
      {val.replace(/_/g, " ")}
    </DropdownMenuCheckboxItem>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">System Audit Logs</h2>
      </div>

      <div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <SearchInput
              value={search || ""}
              onChange={setSearch}
              placeholder="Search by action summary..."
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant={action || actorRole ? "default" : "outline"} className={cn("gap-2 shrink-0 border-2 font-medium px-6 text-base", !(action || actorRole) && "bg-white hover:bg-gray-50 text-foreground border-black/10")}>
                <Filter className="h-4 w-4" />
                Filters {(action || actorRole) ? "(Active)" : ""}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[85vw] sm:w-[600px] max-h-[50vh] sm:max-h-[400px] overflow-y-auto overflow-x-hidden p-0">
              <div className="sticky top-0 bg-background/95 backdrop-blur z-10 p-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">Filter Options</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters({ action: null, actorRole: null, search: null })}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  disabled={!action && !actorRole && !search}
                >
                  Clear All
                </Button>
              </div>

              <div className="p-3">
                <DropdownMenuLabel className="px-0 pt-0 pb-2 text-muted-foreground uppercase text-xs tracking-wider">Filter by Role</DropdownMenuLabel>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-6">
                  {ROLES.map(r => <FilterRoleItem key={r} val={r} />)}
                </div>

                <DropdownMenuSeparator className="mb-4" />
                <DropdownMenuLabel className="px-0 pt-0 pb-2 text-muted-foreground uppercase text-xs tracking-wider">Filter by Action</DropdownMenuLabel>

                <div className="space-y-4">
                  {Object.entries(ACTION_GROUPS).map(([category, actions]) => (
                    <div key={category}>
                      <span className="text-xs font-medium text-foreground px-2 mb-1 block">{category}</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 ml-2">
                        {actions.map(a => <FilterActionItem key={a} val={a} />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <AuditLogTableSkeleton />
        ) : (
          <AuditLogTable
            logs={auditLogs}
            sortConfig={sortConfig}
            requestSort={requestSort}
          />
        )}
      </div>

      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={pagination?.page || 1}
          totalPages={pagination?.totalPages || 1}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}