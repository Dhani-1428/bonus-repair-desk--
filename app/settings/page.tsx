"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/components/language-provider"
import { Lock, Eye, EyeOff, Save } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, login } = useAuth()
  const { t } = useTranslation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    shopName: "",
    contactNumber: "",
    address: "",
    companyEmail: "",
    website: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
  }, [user, router])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Verify password by attempting login
      await login(user!.email, password)
      setIsAuthenticated(true)
      // Load user data
      await loadUserData()
      toast.success("Access granted")
    } catch (error: any) {
      toast.error("Incorrect password. Please try again.")
      setPassword("")
    } finally {
      setLoading(false)
    }
  }

  const loadUserData = async () => {
    try {
      const response = await fetch(`/api/users?id=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            shopName: data.user.shopName || "",
            contactNumber: data.user.contactNumber || "",
            address: data.user.address || "",
            companyEmail: data.user.companyEmail || "",
            website: data.user.website || "",
          })
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
      toast.error("Failed to load user data")
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update credentials")
      }

      toast.success("Credentials updated successfully! You and the super admin will receive email notifications.")
      
      // Update local user data
      const updatedUser = await response.json()
      if (updatedUser.user) {
        // Refresh the page to update user context
        window.location.reload()
      }
    } catch (error: any) {
      console.error("Error updating credentials:", error)
      toast.error(error.message || "Failed to update credentials")
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-20">
          <Card className="shadow-xl border border-blue-200 bg-white">
            <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 text-black">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                Password Required
              </CardTitle>
              <CardDescription className="text-black text-sm sm:text-base">
                Enter your password to view and edit your account credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-black">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 text-black"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Access Credentials"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 text-black">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
            Account Settings
          </h1>
          <p className="text-black mt-2 text-sm sm:text-base">
            Update your account credentials. Changes will be reflected on receipts and you'll receive email notifications.
          </p>
        </div>

        <Card className="shadow-xl border border-blue-200 bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-black">Account Credentials</CardTitle>
            <CardDescription className="text-black text-sm sm:text-base">
              These details will appear on your receipts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div>
                  <Label htmlFor="name" className="text-black">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="text-black"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-black">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="text-black"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shopName" className="text-black">Shop Name</Label>
                  <Input
                    id="shopName"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    className="text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="contactNumber" className="text-black">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="text-black"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-black">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="companyEmail" className="text-black">Company Email</Label>
                  <Input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    className="text-black"
                  />
                </div>
                <div>
                  <Label htmlFor="website" className="text-black">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="text-black"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAuthenticated(false)}
                  className="text-black"
                >
                  Lock
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

