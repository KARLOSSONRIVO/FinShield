'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface CreateTermsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreateTerms: (data: { title: string; content: string; version?: string }) => void
    isCreating?: boolean
}

export function CreateTermsDialog({
    open,
    onOpenChange,
    onCreateTerms,
    isCreating = false,
}: CreateTermsDialogProps) {
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [version, setVersion] = useState('')
    const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

    const validateForm = () => {
        const newErrors: { title?: string; content?: string } = {}

        if (!title || title.trim().length < 3) {
            newErrors.title = 'Title must be at least 3 characters'
        }
        if (!content || content.trim().length < 10) {
            newErrors.content = 'Content must be at least 10 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = () => {
        if (!validateForm()) return

        onCreateTerms({
            title: title.trim(),
            content: content.trim(),
            version: version.trim() || undefined,
        })
        setTitle('')
        setContent('')
        setVersion('')
        setErrors({})
        onOpenChange(false)
    }

    const handleCancel = () => {
        setTitle('')
        setContent('')
        setVersion('')
        setErrors({})
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Terms</DialogTitle>
                    <DialogDescription>
                        Create new terms and conditions. All fields marked with <span className="text-red-500">*</span> are required.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                    {/* Title Field */}
                    <div className="space-y-2">
                        <Label htmlFor="title" className="font-bold text-base">
                            Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value)
                                if (errors.title) setErrors({ ...errors, title: undefined })
                            }}
                            className={cn(
                                "border-2",
                                errors.title ? "border-red-500 focus-visible:ring-red-500" : "border-gray-200"
                            )}
                            placeholder="Enter terms title (min. 3 characters)"
                        />
                        {errors.title && (
                            <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                        )}
                    </div>

                    {/* Content Field */}
                    <div className="space-y-2">
                        <Label htmlFor="content" className="font-bold text-base">
                            Content <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="content"
                            value={content}
                            onChange={(e) => {
                                setContent(e.target.value)
                                if (errors.content) setErrors({ ...errors, content: undefined })
                            }}
                            className={cn(
                                "min-h-[200px] border-2",
                                errors.content ? "border-red-500 focus-visible:ring-red-500" : "border-gray-200"
                            )}
                            placeholder="Enter terms content (min. 10 characters)"
                        />
                        {errors.content && (
                            <p className="text-xs text-red-500 mt-1">{errors.content}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {content.length}/10 characters minimum
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isCreating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {isCreating ? "Creating..." : "Create Terms"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}