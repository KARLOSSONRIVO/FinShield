"use client"

import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/layout/dialog'
import { X } from "lucide-react"
import { Organization } from "@/services/organization.service"
import { components } from '@/types/api'

type User = components["schemas"]["User"]

interface CreateAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newAssignment: {
    companyOrgId: string
    auditorUserId: string
    status: string
  }
  setNewAssignment: (assignment: any) => void
  auditors: User[]
  companies: Organization[]
  onCreateAssignment: () => void
}

export function CreateAssignmentDialog({
  open,
  onOpenChange,
  newAssignment,
  setNewAssignment,
  auditors,
  companies,
  onCreateAssignment,
}: CreateAssignmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[825px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
          <DialogTitle className="text-xl font-normal">Assign Auditor</DialogTitle>
          <DialogClose className="opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="company" className="font-bold text-base">Company</Label>
            <Select
              value={newAssignment.companyOrgId}
              onValueChange={(value) =>
                setNewAssignment({ ...newAssignment, companyOrgId: value })
              }
            >
              <SelectTrigger id="company" className="border border-black rounded-lg h-11 w-full">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent className="border border-black rounded-lg">
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id as string}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="auditor" className="font-bold text-base">Auditor</Label>
            <Select
              value={newAssignment.auditorUserId}
              onValueChange={(value) =>
                setNewAssignment({ ...newAssignment, auditorUserId: value })
              }
            >
              <SelectTrigger id="auditor" className="border border-black rounded-lg h-11 w-full">
                <SelectValue placeholder="Select auditor" />
              </SelectTrigger>
              <SelectContent className="border border-black rounded-lg">
                {auditors.map((auditor) => (
                  <SelectItem key={auditor.id} value={auditor.id as string}>
                    {auditor.firstName} {auditor.lastName} ({(auditor as any).username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status" className="font-bold text-base">Status</Label>
            <Select
              value={newAssignment.status}
              onValueChange={(value) =>
                setNewAssignment({ ...newAssignment, status: value })
              }
            >
              <SelectTrigger id="status" className="border border-black rounded-lg h-11 w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="border border-black rounded-lg">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="mt-auto">
          <Button onClick={onCreateAssignment} className="w-full bg-[#00C28C] hover:bg-[#00C28C]/90 text-white font-bold h-11 rounded-lg text-base">
            Create Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
