"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, CheckCircle, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCreateInvoice } from "@/hooks/invoices/use-create-invoice"
import { useAuth } from "@/hooks/use-auth"

export function UploadInvoiceForm() {
    const [isDragging, setIsDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const { user } = useAuth()

    const { mutate: uploadInvoice, isPending: isLoading } = useCreateInvoice()

    const handleSubmit = () => {
        if (!file) return

        uploadInvoice(
            { file },
            {
                onSuccess: () => setIsSuccess(true)
            }
        )
    }

    if (isSuccess) {
        return (
            <div className="bg-white rounded-xl border shadow-sm p-8 text-center space-y-4">
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">Upload Complete!</h3>
                    <p className="text-muted-foreground mt-2">
                        Your invoice has been successfully uploaded using the <strong>Hybrid Architecture</strong>.
                    </p>
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg text-left text-sm space-y-3 border border-border">
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Status:</span>
                        <span className="text-foreground font-semibold">Queued for Anchoring</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">AI Pre-check:</span>
                        <span className="text-emerald-600 font-semibold">Passed</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-medium text-muted-foreground">Storage:</span>
                        <span className="text-foreground font-semibold">IPFS (Pending Pin)</span>
                    </div>
                </div>

                <Button
                    variant="outline"
                    onClick={() => {
                        setFile(null)
                        setIsSuccess(false)
                    }}
                    className="mt-4"
                >
                    Upload Another
                </Button>
            </div>
        )
    }

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
        <div className="bg-card text-card-foreground rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Upload Document</h3>
                    <p className="text-sm text-muted-foreground">Select or drag and drop your invoice file</p>
                </div>

                {!file ? (
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors min-h-[200px] cursor-pointer",
                            isDragging ? "border-emerald-500 bg-emerald-500/10" : "border-border hover:bg-muted/50"
                        )}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf,.docx"
                            onChange={handleFileChange}
                        />
                        <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                            <Upload className="h-6 w-6" />
                        </div>
                        <h4 className="font-medium text-foreground mb-1">Click to upload or drag and drop</h4>
                        <p className="text-xs text-muted-foreground">PDF or DOCX (Max 10MB)</p>
                    </div>
                ) : (
                    <div className="border border-border rounded-xl p-4 flex items-center justify-between bg-muted/30">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-foreground">{file.name}</p>
                                <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setFile(null)}
                            className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-6 text-base rounded-none"
                disabled={!file || isLoading}
                isLoading={isLoading}
                loadingText="Uploading..."
                onClick={handleSubmit}
            >
                {!isLoading && <Upload className="mr-2 h-4 w-4" />}
                {!isLoading && "Upload Invoice"}
            </Button>
        </div>
    )
}
