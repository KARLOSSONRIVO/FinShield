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
import { useState, useEffect } from "react"
import { RealAssignment } from "@/hooks/assignments/use-assignments"

interface EditAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: RealAssignment | null
  onUpdate: (id: string, status: "ACTIVE" | "INACTIVE") => void
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
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE")

  useEffect(() => {
    if (assignment) {
      setStatus(assignment.status)
    }
  }, [assignment])

  const handleSubmit = () => {
    if (assignment) {
      onUpdate(assignment.id, status)
      onOpenChange(false)
    }
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
          <DialogDescription>
            Update the status for this auditor assignment.
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
              onValueChange={(value: "ACTIVE" | "INACTIVE") => setStatus(value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
