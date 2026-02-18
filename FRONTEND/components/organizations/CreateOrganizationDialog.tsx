"use client"

import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/forms/input'
import { Label } from '@/components/ui/forms/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from '@/components/ui/layout/dialog'
import { Plus, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/forms/select'

interface CreateOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newOrgName: string
    setNewOrgName: (name: string) => void
    newOrgType: string
    setNewOrgType: (type: string) => void
    newOrgEmployeeCount: string
    setNewOrgEmployeeCount: (count: string) => void
    newOrgStatus: string
    setNewOrgStatus: (status: string) => void
    onCreateOrg: () => void
}

export function CreateOrganizationDialog({
    open,
    onOpenChange,
    newOrgName,
    setNewOrgName,
    newOrgType,
    setNewOrgType,
    newOrgEmployeeCount,
    setNewOrgEmployeeCount,
    newOrgStatus,
    setNewOrgStatus,
    onCreateOrg,
}: CreateOrganizationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1025px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="text-xl font-normal">Create New Organization</DialogTitle>
                    <DialogClose className="opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-6 w-6" /> {}
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="orgName" className="font-bold text-base">Organization Name</Label>
                        <Input
                            id="orgName"
                            placeholder="eg. FinShield Platform Inc."
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="border border-black rounded-lg h-11"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Organization Type</Label>
                        <Select value={newOrgType} onValueChange={setNewOrgType}>
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full">
                                <SelectValue placeholder="Select Organization Type" />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                <SelectItem value="FINANCE">Finance</SelectItem>
                                <SelectItem value="GENERAL">General</SelectItem>
                                <SelectItem value="SALES">Sales</SelectItem>
                                <SelectItem value="TECHNOLOGY">Technology</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Employee Number</Label>
                        <Input
                            placeholder="eg. 100"
                            value={newOrgEmployeeCount}
                            onChange={(e) => setNewOrgEmployeeCount(e.target.value)}
                            className="border border-black rounded-lg h-11"
                            type="number"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Organization Status</Label>
                        <Select value={newOrgStatus} onValueChange={setNewOrgStatus}>
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onCreateOrg} className="w-full bg-[#00C28C] hover:bg-[#00C28C]/90 text-white font-bold h-11 rounded-lg text-base">
                        Create Organization
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
