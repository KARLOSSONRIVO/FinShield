"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newOrgName: string
    setNewOrgName: (name: string) => void
    newOrgType: string
    setNewOrgType: (type: string) => void
    newOrgStatus: string
    setNewOrgStatus: (status: string) => void
    onCreateOrg: () => void
    isLoading?: boolean
}

export function CreateOrganizationDialog({
    open,
    onOpenChange,
    newOrgName,
    setNewOrgName,
    newOrgType,
    setNewOrgType,
    newOrgStatus,
    setNewOrgStatus,
    onCreateOrg,
    isLoading = false,
}: CreateOrganizationDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <DialogTitle className="text-xl font-normal">Create New Organization</DialogTitle>
                    <DialogClose className="opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-6 w-6" /> {/* Bigger close icon */}
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="orgName" className="font-bold text-base">Organization Name</Label>
                        <Input
                            id="orgName"
                            placeholder="eg. Company"
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
                                <SelectItem value="ORGANIZATION">Organization</SelectItem>
                                <SelectItem value="COMPANY">Company</SelectItem>
                            </SelectContent>
                        </Select>
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
                    <Button
                        onClick={onCreateOrg}
                        disabled={isLoading}
                        className="w-full bg-[#00C28C] hover:bg-[#00C28C]/90 text-white font-bold h-11 rounded-lg text-base disabled:opacity-50"
                    >
                        {isLoading ? "Creating..." : "Create Organization"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
