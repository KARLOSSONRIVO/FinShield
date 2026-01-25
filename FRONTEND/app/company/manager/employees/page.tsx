"use client"

import { ManagerSidebar } from "@/features/company-manager/navigation-bar/ManagerSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search } from "lucide-react"

import { EmployeeTable } from "@/features/company-manager/employees/components/EmployeeTable"
import { AddEmployeeDialog } from "@/features/company-manager/employees/components/AddEmployeeDialog"
import { useCompanyEmployees } from "@/features/company-manager/employees/hooks/useCompanyEmployees"

export default function ManagerEmployeesPage() {
  const {
    employees,
    getInvoiceCount,
    isAddDialogOpen,
    setIsAddDialogOpen,
    handleCreateEmployee
  } = useCompanyEmployees()

  return (
    <div className="flex h-screen">
      <ManagerSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Employee Management
              </h1>
              <p className="text-muted-foreground">Manage your company employees</p>
            </div>
            <AddEmployeeDialog
              isOpen={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
              onSubmit={handleCreateEmployee}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Company Employees</CardTitle>
              <CardDescription>All employees registered under Acme Corporation</CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search employees..." className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeTable employees={employees} getInvoiceCount={getInvoiceCount} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
