"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { mockAssignments, mockUsers, mockOrganizations } from "@/lib/mock-data"
import { UserPlus, Plus } from "lucide-react"

export default function AssignmentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ companyId: "", auditorId: "", notes: "" })

  const auditors = mockUsers.filter((u) => u.role === "AUDITOR")
  const companies = mockOrganizations.filter((o) => o.type === "company")

  const getCompanyName = (orgId: string) => {
    const org = mockOrganizations.find((o) => o._id === orgId)
    return org?.name || "Unknown"
  }

  const getAuditorName = (userId: string) => {
    const user = mockUsers.find((u) => u._id === userId)
    return user?.username || "Unknown"
  }

  const handleCreateAssignment = () => {
    alert(`Assigning auditor ${newAssignment.auditorId} to company ${newAssignment.companyId}`)
    setNewAssignment({ companyId: "", auditorId: "", notes: "" })
    setIsCreateOpen(false)
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar role="SUPER_ADMIN" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                Auditor Assignments
              </h1>
              <p className="text-muted-foreground">Assign auditors to company organizations</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Assignment</DialogTitle>
                  <DialogDescription>Assign an auditor to review invoices for a company</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Select
                      value={newAssignment.companyId}
                      onValueChange={(v) => setNewAssignment({ ...newAssignment, companyId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Auditor</Label>
                    <Select
                      value={newAssignment.auditorId}
                      onValueChange={(v) => setNewAssignment({ ...newAssignment, auditorId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select auditor" />
                      </SelectTrigger>
                      <SelectContent>
                        {auditors.map((auditor) => (
                          <SelectItem key={auditor._id} value={auditor._id}>
                            {auditor.username} ({auditor.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      placeholder="Add notes about this assignment..."
                      value={newAssignment.notes}
                      onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAssignment}>Create Assignment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>View and manage auditor-company assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Assigned Auditor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAssignments.map((assignment) => (
                    <TableRow key={assignment._id}>
                      <TableCell className="font-medium">{getCompanyName(assignment.companyOrgId)}</TableCell>
                      <TableCell>{getAuditorName(assignment.auditorUserId)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={assignment.status === "active" ? "default" : "secondary"}
                          className={assignment.status === "active" ? "bg-primary text-primary-foreground" : ""}
                        >
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="max-w-xs truncate">{assignment.notes || "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
