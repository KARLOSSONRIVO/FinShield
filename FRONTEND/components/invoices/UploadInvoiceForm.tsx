"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, CheckCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function UploadInvoiceForm() {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)

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
            setFile(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Upload Document</h3>
                    <p className="text-sm text-muted-foreground">Select or drag and drop your invoice file</p>
                </div>

                {!file ? (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors min-h-[200px] cursor-pointer",
                            isDragging ? "border-emerald-500 bg-emerald-50" : "border-gray-200 hover:bg-gray-50"
                        )}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg"
                            onChange={handleFileChange}
                        />
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <Upload className="h-6 w-6" />
                        </div>
                        <h4 className="font-medium text-gray-900 mb-1">Click to upload or drag and drop</h4>
                        <p className="text-xs text-muted-foreground">PDF, PNG or JPG (Max 10MB)</p>
                    </div>
                ) : (
                    <div className="border rounded-xl p-4 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFile(null)}
                            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-6 text-base"
                disabled={!file}
            >
                <Upload className="mr-2 h-4 w-4" />
                Upload Invoice
            </Button>
        </div>
    )
}
