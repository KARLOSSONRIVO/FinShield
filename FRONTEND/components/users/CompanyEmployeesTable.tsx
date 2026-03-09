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
import { User } from "@/lib/types"

interface CompanyEmployeesTableProps {
    employees: User[]
}

export function CompanyEmployeesTable({ employees }: CompanyEmployeesTableProps) {
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
                        <TableHead className="w-[300px] px-6 py-4 text-center text-foreground font-bold text-base">Employee</TableHead>
                        <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Email</TableHead>
                        <TableHead className="px-6 py-4 text-center text-foreground font-bold text-base">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {employees.map((employee) => {
                        const id = employee.id || employee._id
                        return (
                            <TableRow key={id} className="hover:bg-muted/30 transition-colors border-b border-border/50">
                                <TableCell className="px-6 py-4 text-center">
                                    <span className="font-bold text-base text-foreground">{employee.username}</span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                    <span className="text-sm text-foreground font-medium">{employee.email}</span>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-center">
                                    <div className={`${employee.status?.toUpperCase() === 'ACTIVE' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-3 py-1.5 rounded-md text-[10px] font-bold w-fit mx-auto uppercase tracking-wider`}>
                                        {employee.status}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
