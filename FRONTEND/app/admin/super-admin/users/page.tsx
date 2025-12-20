"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockUsers, mockOrganizations } from "@/lib/mock-data"
import { UserStatusBadge } from "@/components/status-badge"
import { Users, Plus, Search, UserX } from "lucide-react"

export default function UsersManagementPage() {
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [disableUserId, setDisableUserId] = useState<string | null>(null)
  const [disableReason, setDisableReason] = useState("")
  const [newUser, setNewUser] = useState({ email: "", username: "", role: "", orgId: "" })

  const platformUsers = mockUsers.filter((u) => u.orgId === "org-platform")
  const companyUsers = mockUsers.filter((u) => u.orgId !== "org-platform")

  const filterUsers = (users: typeof mockUsers) =>
    users.filter(
      (u) =>
        u.email.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()),
    )

  const handleCreateUser = () => {
    alert(`Creating user: ${newUser.email} as ${newUser.role}`)
    setNewUser({ email: "", username: "", role: "", orgId: "" })
    setIsCreateOpen(false)
  }

  const handleDisableUser = () => {
    alert(`Disabling user ${disableUserId} - Reason: ${disableReason}`)
    setDisableUserId(null)
    setDisableReason("")
  }

  const getOrgName = (orgId: string) => {
    const org = mockOrganizations.find((o) => o._id === orgId)
    return org?.name || "Unknown"
  }

  const renderUserTable = (users: typeof mockUsers) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Organization</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filterUsers(users).map((user) => (
          <TableRow key={user._id}>
            <TableCell>
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{user.role.replace("_", " ")}</Badge>
            </TableCell>
            <TableCell>{getOrgName(user.orgId)}</TableCell>
            <TableCell>
              <UserStatusBadge status={user.status} />
            </TableCell>
            <TableCell>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}</TableCell>
            <TableCell>
              {user.status === "active" ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDisableUserId(user._id)}
                    >
                      <UserX className="h-4 w-4 mr-1" />
                      Disable
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disable Account</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to disable {user.email}? They will no longer be able to access the
                        platform.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label htmlFor="reason">Reason for disabling</Label>
                      <Textarea
                        id="reason"
                        placeholder="Enter reason..."
                        value={disableReason}
                        onChange={(e) => setDisableReason(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setDisableUserId(null)
                          setDisableReason("")
                        }}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDisableUser}
                        className="bg-destructive text-destructive-foreground"
                      >
                        Disable Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button variant="ghost" size="sm" className="text-primary">
                  Re-enable
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="flex h-screen">
      <AdminSidebar role="SUPER_ADMIN" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                User Management
              </h1>
              <p className="text-muted-foreground">Manage all users across the platform</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Add a new auditor, regulator, or company manager</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="user@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUDITOR">Auditor</SelectItem>
                        <SelectItem value="REGULATOR">Regulator</SelectItem>
                        <SelectItem value="COMPANY_MANAGER">Company Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUser.role === "COMPANY_MANAGER" && (
                    <div className="space-y-2">
                      <Label htmlFor="org">Organization</Label>
                      <Select value={newUser.orgId} onValueChange={(v) => setNewUser({ ...newUser, orgId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockOrganizations
                            .filter((o) => o.type === "company")
                            .map((org) => (
                              <SelectItem key={org._id} value={org._id}>
                                {org.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateUser}>Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="platform">
                <TabsList>
                  <TabsTrigger value="platform">Platform Staff ({platformUsers.length})</TabsTrigger>
                  <TabsTrigger value="company">Company Users ({companyUsers.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="platform" className="mt-4">
                  {renderUserTable(platformUsers)}
                </TabsContent>
                <TabsContent value="company" className="mt-4">
                  {renderUserTable(companyUsers)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
