"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Filter, Plus, Search, CalendarIcon, Building } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/layout/tabs'
import { Input } from '@/components/ui/forms/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/data-display/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/layout/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/forms/select'
import { Label } from '@/components/ui/forms/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/data-display/popover'
import { Calendar } from '@/components/ui/data-display/calendar'
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useState, useMemo } from "react"
import { mockAssignments, mockUsers, mockOrganizations } from "@/lib/mock-data"
import { CompanyAssignment } from '@/types'

export default function AssignmentDetailPage() {
    const params = useParams()
    const username = params.id as string

    
    const auditor = mockUsers.find(u => u.username === username)
    const auditorName = auditor ? auditor.username : username

    
    const [localAssignments, setLocalAssignments] = useState<CompanyAssignment[]>(() => {
        
        return mockAssignments.filter(a => {
            
            
            
            
            if (!auditor) return false
            return a.auditorUserId === auditor._id
        }).sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    })

    
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [newAssignmentData, setNewAssignmentData] = useState<{
        companyName: string
        taskName: string
        dueDate: Date | undefined
    }>({
        companyName: "",
        taskName: "",
        dueDate: undefined
    })

    
    const [viewAssignment, setViewAssignment] = useState<CompanyAssignment | null>(null)
    const [isViewOpen, setIsViewOpen] = useState(false)

    
    const handleAddAssignment = () => {
        if (!newAssignmentData.companyName || !newAssignmentData.taskName || !newAssignmentData.dueDate) return

        const company = mockOrganizations.find(o => o.name === newAssignmentData.companyName)
        const newAssign: CompanyAssignment = {
            _id: `new-${Date.now()}`,
            companyOrgId: company ? company._id : "unknown",
            auditorUserId: auditor ? auditor._id : "unknown",
            status: "active",
            assignedByUserId: "current-user",
            assignedAt: new Date(),
            taskName: newAssignmentData.taskName,
            dueDate: newAssignmentData.dueDate,
            
        }

        setLocalAssignments([newAssign, ...localAssignments])
        setIsAddOpen(false)
        setNewAssignmentData({ companyName: "", taskName: "", dueDate: undefined })
    }

    const openViewModal = (assignment: CompanyAssignment) => {
        setViewAssignment(assignment)
        setIsViewOpen(true)
    }

    
    const activeAssignments = localAssignments.filter(a => a.status === 'active')
    const inactiveAssignments = localAssignments.filter(a => a.status === 'inactive')

    
    const getCompanyName = (orgId: string) => {
        const org = mockOrganizations.find(o => o._id === orgId)
        return org ? org.name : "Unknown Company"
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/super-admin/assignments">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-normal tracking-tight">Assigning [{auditorName}]</h2>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium">
                            <Plus className="h-4 w-4" />
                            Add Assignment
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Assignment</DialogTitle>
                            <DialogDescription>Assign a new task to {auditorName}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Company</Label>
                                <Select
                                    value={newAssignmentData.companyName}
                                    onValueChange={(v) => setNewAssignmentData({ ...newAssignmentData, companyName: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select company" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {mockOrganizations.filter(o => o.type === 'company').map(org => (
                                            <SelectItem key={org._id} value={org.name}>{org.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Task Name</Label>
                                <Input
                                    placeholder="e.g. Q1 Audit"
                                    value={newAssignmentData.taskName}
                                    onChange={(e) => setNewAssignmentData({ ...newAssignmentData, taskName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2 flex flex-col">
                                <Label>Due Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !newAssignmentData.dueDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {newAssignmentData.dueDate ? format(newAssignmentData.dueDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={newAssignmentData.dueDate}
                                            onSelect={(d) => setNewAssignmentData({ ...newAssignmentData, dueDate: d })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddAssignment}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{viewAssignment?.taskName}</DialogTitle>
                        <DialogDescription>Assignment Details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-muted-foreground">Company</Label>
                                <div className="font-medium flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    {viewAssignment && getCompanyName(viewAssignment.companyOrgId)}
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Status</Label>
                                <div className="font-medium capitalize">{viewAssignment?.status}</div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Assigned Date</Label>
                                <div className="font-medium">{viewAssignment?.assignedAt && format(new Date(viewAssignment.assignedAt), 'PPP')}</div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Due Date</Label>
                                <div className="font-medium">{viewAssignment?.dueDate && format(new Date(viewAssignment.dueDate), 'PPP')}</div>
                            </div>
                        </div>
                        {viewAssignment?.notes && (
                            <div>
                                <Label className="text-muted-foreground">Notes</Label>
                                <div className="p-3 bg-muted rounded-md text-sm italic mt-1">
                                    {viewAssignment.notes}
                                </div>
                            </div>
                        )}
                        {!viewAssignment?.notes && (
                            <div className="text-sm text-muted-foreground italic">No notes provided.</div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Tabs defaultValue="current" className="w-full">
                <TabsList className="bg-muted/50 p-1 h-auto rounded-lg mb-6">
                    <TabsTrigger
                        value="current"
                        className="rounded-md px-6 py-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-bold data-[state=active]:shadow-none font-medium transition-all duration-300"
                    >
                        Current
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="rounded-md px-6 py-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-bold data-[state=active]:shadow-none font-medium transition-all duration-300"
                    >
                        History
                    </TabsTrigger>
                </TabsList>

                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search Assignment..."
                            className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
                        />
                    </div>
                    <Button variant="outline" className="gap-2 border-2 border-black/10 text-base px-6">
                        <Filter className="h-4 w-4" />
                        Filter
                    </Button>
                </div>

                <div className="relative min-h-[400px]">
                    <TabsContent value="current" className="absolute top-0 w-full animate-in fade-in slide-in-from-left-4 duration-300 data-[state=inactive]:animate-out data-[state=inactive]:fade-out data-[state=inactive]:slide-out-to-right-4 data-[state=inactive]:absolute data-[state=inactive]:invisible">
                        <DetailedTable
                            assignments={activeAssignments}
                            type="current"
                            getCompanyName={getCompanyName}
                            onView={openViewModal}
                        />
                    </TabsContent>
                    <TabsContent value="history" className="absolute top-0 w-full animate-in fade-in slide-in-from-right-4 duration-300 data-[state=inactive]:animate-out data-[state=inactive]:fade-out data-[state=inactive]:slide-out-to-left-4 data-[state=inactive]:absolute data-[state=inactive]:invisible">
                        <DetailedTable
                            assignments={inactiveAssignments}
                            type="history"
                            getCompanyName={getCompanyName}
                            onView={openViewModal}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

function DetailedTable({
    assignments,
    type,
    getCompanyName,
    onView
}: {
    assignments: CompanyAssignment[],
    type: string,
    getCompanyName: (id: string) => string,
    onView: (a: CompanyAssignment) => void
}) {
    if (assignments.length === 0) {
        return (
            <div className="w-full p-12 text-center border border-dashed rounded-xl text-muted-foreground">
                N/A
            </div>
        )
    }

    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[250px] px-6 py-4 text-black font-bold text-base">Company</TableHead>
                        <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Assignment</TableHead>
                        <TableHead className="px-6 py-4 text-center text-black font-bold text-base">
                            {type === 'current' ? 'Due Date' : 'Completion Date'}
                        </TableHead>
                        <TableHead className="px-6 py-4 text-center text-black font-bold text-base">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignments.map((row) => (
                        <TableRow key={row._id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50">
                            <TableCell className="px-6 text-black">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                        <Building className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="font-bold text-base text-black">{getCompanyName(row.companyOrgId)}</span>
                                </div>
                            </TableCell>
                            <TableCell className="px-6 text-center font-bold text-base text-black">
                                {row.taskName}
                            </TableCell>
                            <TableCell className="px-6 text-center font-bold text-base text-black">
                                {row.dueDate ? format(new Date(row.dueDate), 'MM/dd/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <Button
                                    size="sm"
                                    className="bg-[#3b5998] hover:bg-[#3b5998]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none"
                                    onClick={() => onView(row)}
                                >
                                    View
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
