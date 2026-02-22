"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// Flexible interface to match various mock objects
interface ViewAssignmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assignment: any
}

export function ViewAssignmentDialog({
    open,
    onOpenChange,
    assignment,
}: ViewAssignmentDialogProps) {
    if (!assignment) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Assignment Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Assignment Name</label>
                            <p className="text-lg font-bold">{assignment.name || assignment.assignment || assignment.taskName}</p>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <div className="mt-1">
                                <Badge variant="outline" className={assignment.status === 'active' || assignment.status === 'Active' ? "bg-emerald-600 text-white border-0" : "bg-blue-600 text-white border-0"}>
                                    {assignment.status}
                                </Badge>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-muted-foreground">
                                {assignment.submissionDate ? "Submission Date" : "Due Date"}
                            </label>
                            <p className="text-base font-medium">
                                {assignment.submissionDate || assignment.dueDate}
                            </p>
                        </div>

                        <div className="col-span-2">
                            <label className="text-sm font-medium text-muted-foreground">Notes</label>
                            <div className="bg-muted p-3 rounded-md mt-1 text-sm italic">
                                {assignment.notes || "No notes provided."}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
