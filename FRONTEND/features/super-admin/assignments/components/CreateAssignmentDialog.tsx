"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

import { User, Organization } from "@/lib/types"

interface CreateAssignmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newAssignment: { company: string; auditor: string; notes: string }
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
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Assignment</DialogTitle>
                    <DialogDescription>Assign an auditor to review invoices for a company</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Company</Label>
                        <Select
                            value={newAssignment.company}
                            onValueChange={(v) => setNewAssignment({ ...newAssignment, company: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((company) => (
                                    <SelectItem key={company._id} value={company.name}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Auditor</Label>
                        <Select
                            value={newAssignment.auditor}
                            onValueChange={(v) => setNewAssignment({ ...newAssignment, auditor: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select auditor" />
                            </SelectTrigger>
                            <SelectContent>
                                {auditors.map((auditor) => (
                                    <SelectItem key={auditor._id} value={auditor.username}>
                                        {auditor.username}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onCreateAssignment}>Create Assignment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
