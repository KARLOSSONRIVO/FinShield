'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onCreateTerms({
            title: title.trim(),
            content: content.trim(),
            version: version.trim() || undefined,
        })
        setTitle('')
        setContent('')
        setVersion('')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create New Terms</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter terms title"
                                required
                                minLength={3}
                                maxLength={200}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Enter terms content"
                                required
                                minLength={10}
                                maxLength={20000}
                                rows={10}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}