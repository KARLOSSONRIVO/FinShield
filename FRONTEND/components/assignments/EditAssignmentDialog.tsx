import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState, useEffect } from "react"
import { RealAssignment } from "@/hooks/assignments/use-assignments"

interface EditAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: RealAssignment | null
  onUpdate: (id: string, data: { status?: "active" | "inactive"; notes?: string }) => void
  companyName: string
  auditorName: string
}

export function EditAssignmentDialog({
  open,
  onOpenChange,
  assignment,
  onUpdate,
  companyName,
  auditorName
}: EditAssignmentDialogProps) {
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (assignment) {
      setStatus(assignment.status)
      setNotes(assignment.notes || "")
    }
  }, [assignment])

  const handleSubmit = () => {
    if (assignment) {
      onUpdate(assignment.id, { status, notes })
      onOpenChange(false)
    }
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the status or notes for this auditor assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Company</Label>
            <div className="p-2 border rounded-md bg-muted text-sm font-medium">
              {companyName}
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Auditor</Label>
            <div className="p-2 border rounded-md bg-muted text-sm font-medium">
              {auditorName}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value: "active" | "inactive") => setStatus(value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this assignment..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
