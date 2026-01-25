"use client"

import Link from "next/link"
import { EmployeeSidebar } from "@/features/company-employee/navigation-bar/EmployeeSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockInvoices } from "@/lib/mock-data"
import { FileText, Search, Upload } from "lucide-react"
import { EmployeeInvoicesTable } from "@/features/company-employee/invoices/components/EmployeeInvoicesTable"

export default function EmployeeInvoicesPage() {
  // Filter invoices for this specific employee
  const myInvoices = mockInvoices.filter((i) => i.uploadedByUserId === "user-employee-1")

  return (
    <div className="flex h-screen">
      <EmployeeSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                My Invoices
              </h1>
              <p className="text-muted-foreground">View and track your submitted invoices</p>
            </div>
            <Link href="/company/employee/upload">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription>All invoices you have submitted</CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search invoices..." className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmployeeInvoicesTable
                invoices={myInvoices}
                linkPrefix="/company/employee/invoices"
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
