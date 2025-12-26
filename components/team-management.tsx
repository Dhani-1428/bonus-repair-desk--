"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { useTranslation } from "@/components/language-provider"
import { toast } from "sonner"
import { getUserData, getCurrentUserId } from "@/lib/storage"

export function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [generatedCredentials, setGeneratedCredentials] = useState<{username: string, password: string, name: string} | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member",
  })
  const [editingMember, setEditingMember] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<any>({})
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { t } = useTranslation()

  const generateUsername = (name: string): string => {
    const base = name.toLowerCase().replace(/\s+/g, '')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${base}${random}`
  }

  const generatePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user from sessionStorage
        const userData = sessionStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)
          setCurrentUser(user)

          // Load team members from API instead of localStorage
          const response = await fetch(`/api/team-members?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            const membersArray = Array.isArray(data.members) ? data.members : []
            setTeamMembers(membersArray)
          } else {
            console.error("[TeamManagement] Failed to load team members from API")
            setTeamMembers([])
          }
        }
      } catch (error) {
        console.error("[TeamManagement] Error loading team members:", error)
        setTeamMembers([])
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailExists = teamMembers.some(
      (member) => member.email.toLowerCase() === formData.email.toLowerCase()
    )
    if (emailExists) {
      toast.error(t("team.error.exists"))
      return
    }

    const username = formData.role === "admin" ? null : generateUsername(formData.name)
    const password = formData.role === "admin" ? "admin123" : generatePassword()

    try {
      const userId = getCurrentUserId()
      if (!userId) {
        toast.error("User not found. Please log in again.")
        return
      }

      // Create team member via API
      const response = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          username: username,
          password: password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create team member")
      }

      const data = await response.json()
      const newMember = data.member

      // Reload team members from API
      const userData = sessionStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        const reloadResponse = await fetch(`/api/team-members?userId=${user.id}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          const membersArray = Array.isArray(reloadData.members) ? reloadData.members : []
          setTeamMembers(membersArray)
        }
      }

      if (formData.role !== "admin" && username) {
        setGeneratedCredentials({
          username: username,
          password: password,
          name: formData.name
        })
      }

      toast.success("Team member added successfully!")
      setFormData({ name: "", email: "", role: "member" })
      setShowForm(false)
    } catch (error: any) {
      console.error("[TeamManagement] Error creating team member:", error)
      toast.error(error.message || "Failed to add team member")
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        toast.error("User not found. Please log in again.")
        return
      }

      // Update team member via API - using POST with update action since PUT route may not exist
      const response = await fetch(`/api/team-members?action=update&id=${memberId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update role")
      }

      // Reload team members from API
      const userData = sessionStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        const reloadResponse = await fetch(`/api/team-members?userId=${user.id}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          const membersArray = Array.isArray(reloadData.members) ? reloadData.members : []
          setTeamMembers(membersArray)
        }
      }
      toast.success("Role updated successfully!")
    } catch (error: any) {
      console.error("[TeamManagement] Error updating role:", error)
      toast.error(error.message || "Failed to update role")
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        toast.error("User not found. Please log in again.")
        return
      }

      // Delete team member via API
      const response = await fetch(`/api/team-members?id=${memberId}&userId=${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete member")
      }

      // Reload team members from API
      const userData = sessionStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        const reloadResponse = await fetch(`/api/team-members?userId=${user.id}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          const membersArray = Array.isArray(reloadData.members) ? reloadData.members : []
          setTeamMembers(membersArray)
        }
      }
      toast.success("Member moved to trash")
    } catch (error: any) {
      console.error("[TeamManagement] Error deleting member:", error)
      toast.error(error.message || t("team.error.delete"))
    }
  }

  const handleEditClick = (member: any) => {
    setEditingMember(member)
    setEditFormData({
      name: member.name,
      email: member.email,
      role: member.role,
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMember) return

    const emailExists = teamMembers.some(
      (member) => member.id !== editingMember.id && member.email.toLowerCase() === editFormData.email.toLowerCase()
    )
    if (emailExists) {
      toast.error(t("team.error.exists"))
      return
    }

    try {
      const userId = getCurrentUserId()
      if (!userId) {
        toast.error("User not found. Please log in again.")
        return
      }

      // Update team member via API - using POST with update action
      const response = await fetch(`/api/team-members?action=update&id=${editingMember.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name: editFormData.name,
          email: editFormData.email,
          role: editFormData.role,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update member")
      }

      // Reload team members from API
      const userData = sessionStorage.getItem("user")
      if (userData) {
        const user = JSON.parse(userData)
        const reloadResponse = await fetch(`/api/team-members?userId=${user.id}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          const membersArray = Array.isArray(reloadData.members) ? reloadData.members : []
          setTeamMembers(membersArray)
        }
      }
      toast.success("Member updated successfully!")
      setIsEditDialogOpen(false)
      setEditingMember(null)
    } catch (error: any) {
      console.error("[TeamManagement] Error updating member:", error)
      toast.error(error.message || "Failed to update member")
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-blue-100 text-blue-700 border border-blue-300"
      case "member":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      default:
        return "bg-blue-100 text-blue-700 border border-blue-300"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg">
          <div>
            <CardTitle className="text-2xl text-white">{t("team.members.title")}</CardTitle>
            <p className="text-sm text-gray-300 mt-1">
              {t("team.members.total").replace("{count}", String(teamMembers.length))}
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transform hover:scale-105 transition-all duration-300"
          >
            {showForm ? t("team.member.edit.cancel") : t("team.members.addButton")}
          </Button>
        </CardHeader>
        <CardContent className="p-6 text-black">
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-6 border-2 border-dashed border-blue-200 rounded-xl bg-white space-y-4">
              <h3 className="text-lg font-semibold text-black mb-4">{t("team.add.title")}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-medium text-black">{t("team.add.fullName")}</Label>
                  <Input
                    id="name"
                    placeholder={t("placeholder.customerName")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white border-blue-300 text-black placeholder:text-gray-400 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-medium text-black">{t("team.add.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-white border-blue-300 text-black placeholder:text-gray-400 focus:border-blue-500"
                  />
                  <p className="text-xs text-black">{t("team.add.emailHint")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="font-medium text-black">{t("team.add.role")}</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger id="role" className="bg-white border-blue-300 text-black">
                    <SelectValue placeholder={t("team.add.role")} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-blue-200" side="bottom" sideOffset={4}>
                    <SelectItem value="member" className="text-black">{t("team.add.role.member")}</SelectItem>
                    <SelectItem value="admin" className="text-black">{t("team.add.role.admin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full md:w-auto shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transform hover:scale-105 transition-all duration-300">
                {t("team.add.submit")}
              </Button>
            </form>
          )}

          {generatedCredentials && (
            <div className="mb-6 p-6 border-2 border-blue-500/50 rounded-xl bg-blue-50">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">{t("team.credentials.title")}</h3>
                  <p className="text-sm text-black">
                    {t("team.credentials.subtitle")} <strong className="text-black">{generatedCredentials.name}</strong>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setGeneratedCredentials(null)}
                  className="hover:bg-blue-100 border-blue-300 text-black"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <Label className="text-xs text-black mb-1 block">{t("team.credentials.username")}</Label>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono font-bold text-black">{generatedCredentials.username}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.username)
                        toast.success(t("team.copied.username"))
                      }}
                      className="h-8 text-black hover:bg-blue-50"
                    >
                      {t("team.credentials.copy")}
                    </Button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <Label className="text-xs text-black mb-1 block">{t("team.credentials.password")}</Label>
                  <div className="flex items-center justify-between">
                    <code className="text-lg font-mono font-bold text-black">{generatedCredentials.password}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCredentials.password)
                        toast.success(t("team.copied.password"))
                      }}
                      className="h-8 text-black hover:bg-blue-50"
                    >
                      {t("team.credentials.copy")}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-black mt-2">{t("team.credentials.warning")}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-5 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl bg-white"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg text-black">{member.name}</h3>
                      <Badge className={`${getRoleBadgeColor(member.role)} font-medium px-2.5 py-0.5`}>
                        {member.role === "admin" ? t("team.member.role.admin") : t("team.member.role.member")}
                      </Badge>
                    </div>
                    <p className="text-sm text-black flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {member.email}
                    </p>
                    {member.username && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-black flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Username: <code className="font-mono text-xs font-semibold text-black">{member.username}</code>
                        </p>
                        {member.password && (
                          <p className="text-xs text-black flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Password: <code className="font-mono text-xs font-semibold text-black">{member.password}</code>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {member.role !== "admin" && (
                    <Select value={member.role} onValueChange={(value) => updateMemberRole(member.id, value)}>
                      <SelectTrigger className="w-48 bg-white border-blue-300 text-black">
                        <SelectValue placeholder={t("team.member.changeRole")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-blue-200" side="bottom" sideOffset={4}>
                        <SelectItem value="member" className="text-black">{t("team.member.role.member")}</SelectItem>
                        <SelectItem value="admin" className="text-black">{t("team.member.role.admin")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(member)}
                    className="hover:bg-blue-50 border-blue-300 text-black"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t("team.member.edit")}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-red-600/20 hover:text-red-400 hover:border-red-500 border-gray-700 text-white"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {t("team.member.delete")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("team.member.deleteTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("team.member.deleteDescription")} <strong>{member.name}</strong>? This action will move the member to trash and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("team.member.edit.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeMember(member.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {t("team.member.deleteConfirm")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white border-blue-200 text-black">
          <DialogHeader>
            <DialogTitle className="text-black">{t("team.member.editTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="font-medium text-black">{t("team.member.edit.fullName")}</Label>
                <Input
                  id="edit-name"
                  placeholder="John Doe"
                  value={editFormData.name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  className="bg-white border-blue-300 text-black placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="font-medium text-black">{t("team.member.edit.email")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john@example.com"
                  value={editFormData.email || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                  className="bg-white border-blue-300 text-black placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="font-medium text-black">{t("team.member.edit.role")}</Label>
              <Select 
                value={editFormData.role || "member"} 
                onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}
              >
                <SelectTrigger id="edit-role" className="bg-white border-blue-300 text-black">
                  <SelectValue placeholder={t("team.member.edit.role")} />
                </SelectTrigger>
                <SelectContent className="bg-white border-blue-200" side="bottom" sideOffset={4}>
                  <SelectItem value="member" className="text-black">{t("team.add.role.member")}</SelectItem>
                  <SelectItem value="admin" className="text-black">{t("team.add.role.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setEditingMember(null)
                }}
                className="border-blue-300 bg-white text-black hover:bg-blue-50"
              >
                {t("team.member.edit.cancel")}
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transform hover:scale-105 transition-all duration-300">
                {t("team.member.edit.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

