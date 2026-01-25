"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Mail, MoreVertical, UserX, UserCheck } from "lucide-react"
import type { User } from "@/lib/types"

interface EmployeeTableProps {
    employees: User[]
    getInvoiceCount: (userId: string) => number
}

export function EmployeeTable({ employees, getInvoiceCount }: EmployeeTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {employees.map((employee) => (
                    <TableRow key={employee._id}>
                        <TableCell className="font-medium">{employee.username}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {employee.email}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                                {employee.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{getInvoiceCount(employee._id)}</TableCell>
                        <TableCell>
                            {employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>{new Date(employee.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Reset Password
                                    </DropdownMenuItem>
                                    {employee.status === "active" ? (
                                        <DropdownMenuItem className="text-destructive">
                                            <UserX className="h-4 w-4 mr-2" />
                                            Disable Account
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem>
                                            <UserCheck className="h-4 w-4 mr-2" />
                                            Enable Account
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
