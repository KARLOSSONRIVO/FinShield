'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { Terms } from '@/services/terms.service'
import { cn } from '@/lib/utils'

interface TermsCardProps {
    terms: Terms
    onUpdate?: (data: { id: string; data: { title?: string; content?: string; version?: string } }) => void
    onDelete?: (id: string) => void
    isUpdating?: boolean
    isDeleting?: boolean
    isExpanded?: boolean
    onExpandToggle?: () => void
    isReadOnly?: boolean
}

export function TermsCard({
    terms,
    onUpdate,
    onDelete,
    isUpdating,
    isDeleting,
    isExpanded = false,
    onExpandToggle,
    isReadOnly = false
}: TermsCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(terms.title)
    const [content, setContent] = useState(terms.content)
    const [version, setVersion] = useState(terms.version)
    const [errors, setErrors] = useState<{ title?: string; content?: string }>({})

    const validateForm = () => {
        const newErrors: { title?: string; content?: string } = {}

        if (!title || title.length < 3) {
            newErrors.title = 'Title must be at least 3 characters'
        }
        if (!content || content.length < 10) {
            newErrors.content = 'Content must be at least 10 characters'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = () => {
        if (!validateForm() || !onUpdate) return

        onUpdate({
            id: terms.id,
            data: {
                title: title !== terms.title ? title : undefined,
                content: content !== terms.content ? content : undefined,
                version: version !== terms.version ? version : undefined
            }
        })
        setIsEditing(false)
    }

    const handleCancel = () => {
        setTitle(terms.title)
        setContent(terms.content)
        setVersion(terms.version)
        setErrors({})
        setIsEditing(false)
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        } catch {
            return 'Invalid date'
        }
    }

    const toggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onExpandToggle) {
            onExpandToggle()
        }
    }

    return (
        <Card className={cn(
            'relative border-2 transition-all duration-200',
            isExpanded ? 'border-emerald-200 shadow-md' : 'border-gray-200 hover:border-emerald-200'
        )}>
            {/* Three dots menu */}
            {!isReadOnly && (
                <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsEditing(true)} disabled={isUpdating}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Terms
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete && onDelete(terms.id)}
                                disabled={isDeleting}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Terms
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            <CardHeader className="pr-12 pb-3">
                <div className="flex items-center gap-2">
                    {/* Chevron for expand/collapse - only show when not editing */}
                    {!isEditing && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 hover:bg-transparent shrink-0"
                            onClick={toggleExpand}
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                        </Button>
                    )}

                    {isEditing ? (
                        <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`title-${terms.id}`} className="font-bold">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id={`title-${terms.id}`}
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value)
                                        if (errors.title) setErrors({ ...errors, title: undefined })
                                    }}
                                    className={cn(
                                        'border-2',
                                        errors.title ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200'
                                    )}
                                    placeholder="Terms title"
                                />
                                {errors.title && (
                                    <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center flex-wrap gap-x-2">
                            <CardTitle className="text-xl">{terms.title}</CardTitle>
                        </div>
                    )}
                </div>
            </CardHeader>

            {/* Content and Version - only shown when expanded or editing */}
            {(isExpanded || isEditing) && (
                <CardContent className="pt-0 pb-3">
                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor={`content-${terms.id}`} className="font-bold">
                                    Content <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id={`content-${terms.id}`}
                                    value={content}
                                    onChange={(e) => {
                                        setContent(e.target.value)
                                        if (errors.content) setErrors({ ...errors, content: undefined })
                                    }}
                                    className={cn(
                                        'min-h-[150px] border-2',
                                        errors.content ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-200'
                                    )}
                                    placeholder="Terms content"
                                />
                                {errors.content && (
                                    <p className="text-xs text-red-500 mt-1">{errors.content}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <CardDescription className="text-base whitespace-pre-wrap">
                                {terms.content}
                            </CardDescription>

                            {/* Version shown with content when expanded */}
                            <div className="mt-4 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-md font-mono text-sm font-bold border border-emerald-200 inline-block">
                                v{terms.version}
                            </div>
                        </>
                    )}
                </CardContent>
            )}

            {/* Footer with save/cancel when editing */}
            {isEditing && (
                <CardFooter className="border-t pt-4">
                    <div className="w-full flex items-center justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="gap-1"
                            disabled={isUpdating}
                        >
                            <X className="h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            disabled={isUpdating}
                        >
                            <Check className="h-4 w-4" />
                            {isUpdating ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}