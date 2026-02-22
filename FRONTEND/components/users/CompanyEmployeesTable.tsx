"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface CompanyEmployeesTableProps {
    orgId: string
    managerId: string
}

export function CompanyEmployeesTable({ orgId, managerId }: CompanyEmployeesTableProps) {
    // Filter mock users for this organization, excluding the manager themselves
    const employees: any[] = []

    if (employees.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">
                No employees found for this company.
            </div>
        )
    }

    return (
        <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-x-auto mt-4">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="w-[300px] px-6 py-4 text-center text-foreground font-bold text-base">Employee Username</TableHead>
                        <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Email</TableHead>
                        <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Status</TableHead>
                        <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee) => (
                        <TableRow key={employee._id} className="h-24 hover:bg-muted/30 transition-colors border-b border-border/50">
                            <TableCell className="px-6 text-center">
                                <span className="font-bold text-base text-foreground">{employee.username}</span>
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <span className="text-sm text-foreground font-medium">{employee.email}</span>
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                <div className={`${employee.status === 'active' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                    {employee.status}
                                </div>
                            </TableCell>
                            <TableCell className="px-6 text-center">
                                {employee.status === 'active' ? (
                                    <Badge
                                        className="bg-[#ff4d4f] hover:bg-[#ff4d4f]/90 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none cursor-not-allowed opacity-50"
                                    >
                                        Disable
                                    </Badge>
                                ) : (
                                    <Badge
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-4 rounded-md text-xs shadow-none cursor-not-allowed opacity-50"
                                    >
                                        Enable
                                    </Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
