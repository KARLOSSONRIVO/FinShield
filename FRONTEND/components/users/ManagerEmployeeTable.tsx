"use client"

import { UserTable } from "./UserTable"
import { User } from '@/types'

interface ManagerEmployeeTableProps {
    users: User[]
    sortConfig: any
    onSort: (key: any) => void
    onDisableUser: (userId: string) => void
}

export function ManagerEmployeeTable(props: ManagerEmployeeTableProps) {
    return (
        <UserTable
            {...props}
            onUpdateStatus={(userId, status) => {
                if (status === "SUSPENDED") {
                    props.onDisableUser(userId)
                }
            }}
        />
    )
}
