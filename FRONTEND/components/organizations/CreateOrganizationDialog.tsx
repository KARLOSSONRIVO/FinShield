"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
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
import { Plus, X, Upload, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface CreateOrganizationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    newOrgName: string
    setNewOrgName: (name: string) => void
    newInvoiceTemplate: File | null
    setNewInvoiceTemplate: (file: File | null) => void
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
    newInvoiceTemplate,
    setNewInvoiceTemplate,
    newOrgType,
    setNewOrgType,
    newOrgStatus,
    setNewOrgStatus,
    onCreateOrg,
    isLoading = false,
}: CreateOrganizationDialogProps) {
    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setNewInvoiceTemplate(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewInvoiceTemplate(e.target.files[0])
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] border border-black shadow-none rounded-xl flex flex-col" showCloseButton={false}>
                <DialogHeader className="flex flex-row items-center justify-between border-b pb-2">
                    <DialogTitle className="text-xl font-normal">Create New Organization</DialogTitle>
                    <DialogClose className="opacity-70 transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <X className="h-6 w-6" /> {/* Bigger close icon */}
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="orgName" className="font-bold text-base">Name</Label>
                        <Input
                            id="orgName"
                            placeholder="eg. Company"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="border border-black rounded-lg h-11"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Type</Label>
                        <Select value={newOrgType} onValueChange={setNewOrgType}>
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                <SelectItem value="organization">Organization</SelectItem>
                                <SelectItem value="company">Company</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Status</Label>
                        <Select value={newOrgStatus} onValueChange={setNewOrgStatus}>
                            <SelectTrigger className="border border-black rounded-lg h-11 w-full">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent className="border border-black rounded-lg">
                                <SelectItem value="active">Active</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label className="font-bold text-base">Invoice Template</Label>
                        {!newInvoiceTemplate ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                                    isDragging ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:bg-muted/50"
                                )}
                                onClick={() => document.getElementById('org-file-upload')?.click()}
                            >
                                <input
                                    id="org-file-upload"
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                />
                                <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center mb-2 text-muted-foreground">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <h4 className="font-medium text-sm text-foreground mb-1">Upload template</h4>
                                <p className="text-xs text-muted-foreground">PDF or DOCX (Max 10MB)</p>
                            </div>
                        ) : (
                            <div className="border border-border rounded-xl p-3 flex items-center justify-between bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-xs text-foreground truncate max-w-[200px]">{newInvoiceTemplate.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{(newInvoiceTemplate.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setNewInvoiceTemplate(null)}
                                    className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
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
