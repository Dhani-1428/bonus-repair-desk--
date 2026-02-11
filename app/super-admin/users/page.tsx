"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SuperAdminLayout } from "@/components/super-admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { getAllUsers, getUserData, isSuperAdmin } from "@/lib/storage"
import { getAllSubscriptions, isExpired, getDaysUntilExpiration, getSubscriptionEndDate } from "@/lib/subscription-utils"
import { PLAN_PRICING } from "@/lib/constants"
import { toast } from "sonner"
import Link from "next/link"
import { Download, Eye, EyeOff, Info, Edit, Trash2, CreditCard } from "lucide-react"
import { UserDetailsDialog } from "@/components/user-details-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface UserAnalytics {
  userId: string
  userName: string
  userEmail: string
  shopName: string
  password: string
  subscriptionPlan: string
  subscriptionStatus: string
  daysUntilExpiration: number
  signupDate: string
  lastLogin?: string
  totalLogins: number
}

export default function UsersInformationPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([])
  const [allSubscriptions, setAllSubscriptions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState<UserAnalytics | null>(null)
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserAnalytics | null>(null)
  const [isUserDetailsDialogOpen, setIsUserDetailsDialogOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserAnalytics | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    shopName: "",
    contactNumber: "",
    address: "",
    companyEmail: "",
    website: "",
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [selectedUserForSetSubscription, setSelectedUserForSetSubscription] = useState<UserAnalytics | null>(null)
  const [isSetSubscriptionDialogOpen, setIsSetSubscriptionDialogOpen] = useState(false)
  const [selectedSubscriptionPlan, setSelectedSubscriptionPlan] = useState<"FREE_TRIAL" | "SIX_MONTH" | "TWELVE_MONTH" | null>(null)
  const [isSettingSubscription, setIsSettingSubscription] = useState(false)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (user.role !== "SUPER_ADMIN" && user.role !== "super_admin" && user.email !== "superadmin@admin.com") {
      router.push("/dashboard")
      return
    }

    loadUsers()
  }, [user, loading, router])

  const loadUsers = async () => {
    try {
      console.log("[UsersPage] Fetching users from API...")
      // Fetch users from API
      const response = await fetch("/api/users")
      console.log("[UsersPage] Response status:", response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log("[UsersPage] Received data:", { 
          hasUsers: !!data.users, 
          userCount: data.users?.length || 0,
          sampleUser: data.users?.[0] 
        })
        
        const allUsers = data.users ? data.users.filter((u: any) => u.role !== "SUPER_ADMIN" && u.role !== "super_admin") : []
        console.log("[UsersPage] Filtered users count:", allUsers.length)
        setUsers(allUsers)
        await calculateAnalytics(allUsers)
      } else {
        // Get error message from response
        const errorData = await response.json().catch(() => ({}))
        console.error("[UsersPage] API error:", response.status, errorData)
        toast.error(`Failed to load users: ${errorData.error || response.statusText}`)
        
        // Fallback to API function
        try {
          console.log("[UsersPage] Trying fallback getAllUsers()...")
          const allUsers = await getAllUsers()
          const filtered = allUsers.filter((u: any) => u.role !== "SUPER_ADMIN" && u.role !== "super_admin")
          console.log("[UsersPage] Fallback users count:", filtered.length)
          setUsers(filtered)
          await calculateAnalytics(filtered)
        } catch (fallbackError) {
          console.error("[UsersPage] Fallback also failed:", fallbackError)
          toast.error("Failed to load users. Please refresh the page.")
          setUsers([])
        }
      }
    } catch (error: any) {
      console.error("[UsersPage] Error loading users:", error)
      toast.error(`Error loading users: ${error?.message || "Unknown error"}`)
      
      // Fallback to API function
      try {
        console.log("[UsersPage] Trying fallback getAllUsers() after error...")
        const allUsers = await getAllUsers()
        const filtered = allUsers.filter((u: any) => u.role !== "SUPER_ADMIN" && u.role !== "super_admin")
        console.log("[UsersPage] Fallback users count:", filtered.length)
        setUsers(filtered)
        await calculateAnalytics(filtered)
      } catch (fallbackError) {
        console.error("[UsersPage] Fallback also failed:", fallbackError)
        toast.error("Failed to load users. Please check your connection and refresh.")
        setUsers([])
      }
    }
  }

  const calculateAnalytics = async (allUsers: any[]) => {
    console.log("[UsersPage] Calculating analytics for", allUsers.length, "users")
    
    // Fetch subscriptions from API instead of localStorage
    let subscriptionsData: any[] = []
    try {
      console.log("[UsersPage] Fetching subscriptions from API...")
      const subscriptionsResponse = await fetch("/api/subscriptions/all")
      if (subscriptionsResponse.ok) {
        const data = await subscriptionsResponse.json()
        subscriptionsData = data.subscriptions || []
        console.log("[UsersPage] Found subscriptions:", subscriptionsData.length)
        setAllSubscriptions(subscriptionsData)
      } else {
        console.warn("[UsersPage] Subscriptions API failed, using fallback")
        // Fallback to localStorage if API fails
        subscriptionsData = getAllSubscriptions()
        setAllSubscriptions(subscriptionsData)
      }
    } catch (error) {
      console.error("[UsersPage] Error fetching subscriptions:", error)
      // Fallback to localStorage if API fails
      subscriptionsData = getAllSubscriptions()
      setAllSubscriptions(subscriptionsData)
    }

    const analytics: UserAnalytics[] = []

    // Fetch user data without device/repair ticket information
    const userDataPromises = allUsers.map(async (u: any) => {
      // Get subscription info - find the most recent subscription for this user
      const userSubs = subscriptionsData.filter((s: any) => (s.userId || s.user_id) === u.id)
      const userSub = userSubs.length > 0 
        ? userSubs.sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())[0]
        : null
      
      const daysUntilExpiration = userSub ? getDaysUntilExpiration(userSub) : 0
      
      // Determine subscription status
      let subscriptionStatus = "No Subscription"
      if (userSub) {
        const status = (userSub.status || "").toUpperCase()
        const isFreeTrial = userSub.isFreeTrial || status === "FREE_TRIAL" || status === "free_trial"
        
        if (isExpired(userSub)) {
          subscriptionStatus = "Expired"
        } else if (isFreeTrial) {
          subscriptionStatus = "Free Trial"
        } else if (status === "PENDING") {
          subscriptionStatus = "Pending"
        } else if (status === "ACTIVE") {
          subscriptionStatus = "Active"
        } else {
          subscriptionStatus = status || "Unknown"
        }
      }
      
      // Get login history from database
      let lastLogin: string | null = null
      let totalLogins = 0
      try {
        const loginResponse = await fetch(`/api/login-history?userId=${u.id}`)
        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          const loginHistory = Array.isArray(loginData.history) ? loginData.history : []
          totalLogins = loginHistory.length
          if (loginHistory.length > 0) {
            // Sort by timestamp descending and get the most recent
            const sorted = loginHistory.sort((a: any, b: any) => 
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
            lastLogin = sorted[0].timestamp
          }
        }
      } catch (error) {
        console.error(`Error fetching login history for user ${u.id}:`, error)
      }

      return {
        userId: u.id,
        userName: u.name,
        userEmail: u.email,
        shopName: u.shopName || "-",
        password: u.password || "N/A",
        subscriptionPlan: userSub ? (PLAN_PRICING[userSub.plan]?.name || userSub.plan) : "No Subscription",
        subscriptionStatus: subscriptionStatus,
        daysUntilExpiration: daysUntilExpiration,
        signupDate: u.createdAt,
        lastLogin: lastLogin,
        totalLogins: totalLogins,
      }
    })

    const results = await Promise.all(userDataPromises)
    analytics.push(...results)

    setUserAnalytics(analytics)
  }

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }))
  }

  const exportToCSV = () => {
    const headers = [
      "User Name",
      "Email",
      "Password",
      "Shop Name",
      "Subscription Plan",
      "Status",
      "Expiry Date",
      "Days Left",
      "Total Revenue (€)"
    ]

    const rows = filteredAnalytics.map(analytics => {
      const userSubs = allSubscriptions.filter((s: any) => (s.userId || s.user_id) === analytics.userId)
      const userSub = userSubs.length > 0 
        ? userSubs.sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())[0]
        : null
      const expiryDate = userSub ? getSubscriptionEndDate(userSub).toLocaleDateString() : "No Subscription"
      const daysLeft = analytics.daysUntilExpiration >= 0 ? analytics.daysUntilExpiration : "Expired"
      
      return [
        analytics.userName,
        analytics.userEmail,
        analytics.password,
        analytics.shopName,
        analytics.subscriptionPlan,
        analytics.subscriptionStatus,
        expiryDate,
        daysLeft,
        Number.parseFloat(analytics.totalRevenue || 0).toFixed(2)
      ]
    })

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `users_analytics_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Data exported to CSV successfully!")
  }

  const filteredAnalytics = userAnalytics.filter((analytics) =>
    analytics.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analytics.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analytics.shopName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "super_admin" && user.email !== "superadmin@admin.com") {
    return null
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-white">
              Users Information
            </h1>
            <p className="text-gray-300 text-balance">
              Analytics, Login Credentials & Subscription History
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={exportToCSV}
              variant="outline"
              className="border-gray-700 bg-gray-900/50 text-white hover:bg-gray-800"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
            <Link href="/super-admin">
              <Button variant="outline" className="border-gray-700 bg-gray-900/50 text-white hover:bg-gray-800">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <Input
              placeholder="Search by name, email, or shop name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
            />
          </CardContent>
        </Card>

        {/* Excel-like Table */}
        <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg px-6 py-4">
            <CardTitle className="text-xl text-white">
              Users Data Sheet ({filteredAnalytics.length} users)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr className="bg-gray-800/80 border-b border-gray-700">
                  <th className="border-r border-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-[15%]">
                    User Name
                  </th>
                  <th className="border-r border-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-[18%]">
                    Email
                  </th>
                  <th className="border-r border-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-[15%]">
                    Password
                  </th>
                  <th className="border-r border-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-[12%]">
                    Shop Name
                  </th>
                  <th className="border-r border-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-[15%]">
                    Subscription Plan
                  </th>
                  <th className="border-r border-gray-700 px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider w-[10%]">
                    Status
                  </th>
                  <th className="border-r border-gray-700 px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider w-[12%]">
                    Expiry Date
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider w-[10%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filteredAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredAnalytics.map((analytics, index) => (
                    <tr
                      key={analytics.userId}
                      className={`hover:bg-gray-800/30 transition-colors ${
                        index % 2 === 0 ? "bg-gray-900/30" : "bg-gray-900/10"
                      }`}
                    >
                      <td className="border-r border-gray-700/50 px-4 py-3 text-sm font-medium text-white break-words">
                        <div className="flex items-center gap-2">
                          <span 
                            className="cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => {
                              setSelectedUserForDetails(analytics)
                              setIsUserDetailsDialogOpen(true)
                            }}
                            title="Click to view full user details"
                          >
                            {analytics.userName}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForSubscription(analytics)
                              setIsSubscriptionDialogOpen(true)
                            }}
                            className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            title="View subscription details"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                      <td className="border-r border-gray-700/50 px-4 py-3 text-sm text-gray-300 break-words">
                        {analytics.userEmail}
                      </td>
                      <td className="border-r border-gray-700/50 px-4 py-3 text-sm text-gray-300">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs break-all">
                            {showPasswords[analytics.userId] 
                              ? analytics.password 
                              : "•".repeat(analytics.password.length || 8)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePasswordVisibility(analytics.userId)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white shrink-0"
                          >
                            {showPasswords[analytics.userId] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                      <td className="border-r border-gray-700/50 px-4 py-3 text-sm text-gray-300 break-words">
                        {analytics.shopName}
                      </td>
                      <td className="border-r border-gray-700/50 px-4 py-3 text-sm text-gray-300 break-words">
                        {analytics.subscriptionPlan}
                      </td>
                      <td className="border-r border-gray-700/50 px-4 py-3 text-sm">
                        <Badge
                          className={
                            analytics.subscriptionStatus === "Active"
                              ? "bg-green-500/20 text-green-400 border-green-500/50"
                              : analytics.subscriptionStatus === "Free Trial"
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                              : analytics.subscriptionStatus === "Pending"
                              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                              : analytics.subscriptionStatus === "Expired"
                              ? "bg-red-500/20 text-red-400 border-red-500/50"
                              : "bg-gray-500/20 text-gray-400 border-gray-500/50"
                          }
                        >
                          {analytics.subscriptionStatus}
                        </Badge>
                      </td>
                      <td className="border-r border-gray-700/50 px-4 py-3 text-sm text-center">
                        {(() => {
                          // Find subscription from state
                          const userSubs = allSubscriptions.filter((s: any) => (s.userId || s.user_id) === analytics.userId)
                          const userSub = userSubs.length > 0 
                            ? userSubs.sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())[0]
                            : null
                          
                          if (!userSub) {
                            return <span className="text-gray-400">No Subscription</span>
                          }
                          
                          const endDate = getSubscriptionEndDate(userSub)
                          const daysLeft = analytics.daysUntilExpiration
                          const isExpired = daysLeft < 0
                          const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7
                          const status = (userSub.status || "").toUpperCase()
                          const isTrial = userSub.isFreeTrial || status === "FREE_TRIAL" || status === "free_trial"
                          
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-xs text-gray-400 mb-0.5`}>
                                {isTrial ? "Trial Expires" : "Expires"}
                              </span>
                              <span className={isExpired ? "text-red-400 font-semibold" : isExpiringSoon ? "text-yellow-400 font-semibold" : "text-gray-300"}>
                                {endDate.toLocaleDateString()}
                              </span>
                              <span className={`text-xs ${isExpired ? "text-red-400" : isExpiringSoon ? "text-yellow-400" : "text-gray-500"}`}>
                                {isExpired ? "Expired" : daysLeft >= 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : "Expired"}
                              </span>
                            </div>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserForSetSubscription(analytics)
                              setIsSetSubscriptionDialogOpen(true)
                            }}
                            className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                            title="Set subscription"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const user = users.find((u: any) => u.id === analytics.userId)
                              if (user) {
                                setEditFormData({
                                  name: user.name || "",
                                  email: user.email || "",
                                  shopName: user.shopName || "",
                                  contactNumber: user.contactNumber || "",
                                  address: user.address || "",
                                  companyEmail: user.companyEmail || "",
                                  website: user.website || "",
                                })
                                setSelectedUserForEdit(analytics)
                                setIsEditDialogOpen(true)
                              }
                            }}
                            className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUserToDelete(analytics.userId)
                            }}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* User Subscription Dialog */}
        <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
          <DialogContent className="max-w-3xl bg-white border-blue-200 max-h-[90vh] overflow-y-auto text-black">
            <DialogHeader>
              <DialogTitle className="text-black">
                Subscription Details - {selectedUserForSubscription?.userName}
              </DialogTitle>
            </DialogHeader>
            {selectedUserForSubscription && (() => {
              const userSubs = allSubscriptions.filter((s: any) => (s.userId || s.user_id) === selectedUserForSubscription.userId)
              const userSub = userSubs.length > 0 
                ? userSubs.sort((a: any, b: any) => new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime())[0]
                : null
              
              return (
                <div className="space-y-4">
                  {userSub ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-black">Plan</p>
                          <p className="text-sm text-black">{selectedUserForSubscription.subscriptionPlan}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-black">Status</p>
                          <Badge
                            className={
                              selectedUserForSubscription.subscriptionStatus === "Active"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : selectedUserForSubscription.subscriptionStatus === "Expired"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }
                          >
                            {selectedUserForSubscription.subscriptionStatus}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-black">Start Date</p>
                          <p className="text-sm text-black">
                            {new Date(userSub.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-black">End Date</p>
                          <p className="text-sm text-black">
                            {getSubscriptionEndDate(userSub).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-black">Price</p>
                          <p className="text-sm text-black font-semibold">€{PLAN_PRICING[userSub.plan]?.price || 0}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-black">
                            {(() => {
                              const isTrial = userSub.isFreeTrial || userSub.status === "free_trial" || userSub.status === "FREE_TRIAL"
                              const isSixMonth = userSub.plan === "SIX_MONTH"
                              const isTwelveMonth = userSub.plan === "TWELVE_MONTH"
                              
                              if (isTrial) {
                                return "Trial Expire Date"
                              } else if (isSixMonth) {
                                return "6 Months Subscription Expire Date"
                              } else if (isTwelveMonth) {
                                return "12 Months Subscription Expire Date"
                              }
                              return "Expiry Date"
                            })()}
                          </p>
                          <p className={`text-sm font-semibold ${
                            selectedUserForSubscription.daysUntilExpiration >= 0
                              ? selectedUserForSubscription.daysUntilExpiration <= 7
                                ? "text-yellow-700"
                                : "text-black"
                              : "text-red-700"
                          }`}>
                            {getSubscriptionEndDate(userSub).toLocaleDateString()}
                          </p>
                          <p className={`text-xs ${
                            selectedUserForSubscription.daysUntilExpiration >= 0
                              ? selectedUserForSubscription.daysUntilExpiration <= 7
                                ? "text-yellow-600"
                                : "text-gray-600"
                              : "text-red-600"
                          }`}>
                            {selectedUserForSubscription.daysUntilExpiration >= 0
                              ? `${selectedUserForSubscription.daysUntilExpiration} day${selectedUserForSubscription.daysUntilExpiration !== 1 ? 's' : ''} left`
                              : "Expired"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-blue-200">
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Save current subscription to history
                            const subscriptionHistory = JSON.parse(localStorage.getItem(`subscription_history_${userSub.userId}`) || "[]")
                            subscriptionHistory.push({
                              ...userSub,
                              status: "expired" as const,
                            })
                            localStorage.setItem(`subscription_history_${userSub.userId}`, JSON.stringify(subscriptionHistory.slice(-20)))

                            const newEndDate = new Date(userSub.endDate)
                            newEndDate.setMonth(newEndDate.getMonth() + 1)
                            const updatedSub = {
                              ...userSub,
                              endDate: newEndDate.toISOString(),
                              status: "active" as const,
                            }
                            localStorage.setItem(`subscription_${userSub.userId}`, JSON.stringify(updatedSub))
                            toast.success("Subscription extended by 1 month!")
                            setIsSubscriptionDialogOpen(false)
                            loadUsers()
                          }}
                          className="flex-1 border-blue-300 bg-white text-black hover:bg-blue-50"
                        >
                          Extend 1 Month
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Save current subscription to history
                            const subscriptionHistory = JSON.parse(localStorage.getItem(`subscription_history_${userSub.userId}`) || "[]")
                            subscriptionHistory.push({
                              ...userSub,
                              status: "expired" as const,
                            })
                            localStorage.setItem(`subscription_history_${userSub.userId}`, JSON.stringify(subscriptionHistory.slice(-20)))

                            const newEndDate = new Date(userSub.endDate)
                            newEndDate.setMonth(newEndDate.getMonth() + 3)
                            const updatedSub = {
                              ...userSub,
                              endDate: newEndDate.toISOString(),
                              status: "active" as const,
                            }
                            localStorage.setItem(`subscription_${userSub.userId}`, JSON.stringify(updatedSub))
                            toast.success("Subscription extended by 3 months!")
                            setIsSubscriptionDialogOpen(false)
                            loadUsers()
                          }}
                          className="flex-1 border-blue-300 bg-white text-black hover:bg-blue-50"
                        >
                          Extend 3 Months
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Save current subscription to history
                            const subscriptionHistory = JSON.parse(localStorage.getItem(`subscription_history_${userSub.userId}`) || "[]")
                            subscriptionHistory.push({
                              ...userSub,
                              status: "cancelled" as const,
                            })
                            localStorage.setItem(`subscription_history_${userSub.userId}`, JSON.stringify(subscriptionHistory.slice(-20)))

                            const updatedSub = {
                              ...userSub,
                              status: "cancelled" as const,
                            }
                            localStorage.setItem(`subscription_${userSub.userId}`, JSON.stringify(updatedSub))
                            toast.success("Subscription cancelled!")
                            setIsSubscriptionDialogOpen(false)
                            loadUsers()
                          }}
                          className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Cancel Subscription
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-black">No subscription found for this user.</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Set Subscription Dialog */}
        <Dialog open={isSetSubscriptionDialogOpen} onOpenChange={setIsSetSubscriptionDialogOpen}>
          <DialogContent className="max-w-md bg-white border-blue-200 text-black">
            <DialogHeader>
              <DialogTitle className="text-black text-xl">
                Set Subscription - {selectedUserForSetSubscription?.userName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-black font-semibold">Select Subscription Plan</Label>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    type="button"
                    variant={selectedSubscriptionPlan === "FREE_TRIAL" ? "default" : "outline"}
                    onClick={() => setSelectedSubscriptionPlan("FREE_TRIAL")}
                    className={`w-full justify-start text-left h-auto py-3 ${
                      selectedSubscriptionPlan === "FREE_TRIAL"
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "border-blue-300 bg-white text-black hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">Free Trial</span>
                      <span className="text-xs opacity-80">7 days free access</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedSubscriptionPlan === "SIX_MONTH" ? "default" : "outline"}
                    onClick={() => setSelectedSubscriptionPlan("SIX_MONTH")}
                    className={`w-full justify-start text-left h-auto py-3 ${
                      selectedSubscriptionPlan === "SIX_MONTH"
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "border-blue-300 bg-white text-black hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">6 Months</span>
                      <span className="text-xs opacity-80">€{PLAN_PRICING.SIX_MONTH.price} - 6 months access</span>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedSubscriptionPlan === "TWELVE_MONTH" ? "default" : "outline"}
                    onClick={() => setSelectedSubscriptionPlan("TWELVE_MONTH")}
                    className={`w-full justify-start text-left h-auto py-3 ${
                      selectedSubscriptionPlan === "TWELVE_MONTH"
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "border-blue-300 bg-white text-black hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">12 Months</span>
                      <span className="text-xs opacity-80">€{PLAN_PRICING.TWELVE_MONTH.price} - 12 months access</span>
                    </div>
                  </Button>
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-blue-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSetSubscriptionDialogOpen(false)
                    setSelectedSubscriptionPlan(null)
                  }}
                  className="flex-1 border-blue-300 bg-white text-black hover:bg-blue-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!selectedUserForSetSubscription || !selectedSubscriptionPlan) {
                      toast.error("Please select a subscription plan")
                      return
                    }

                    setIsSettingSubscription(true)
                    try {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      today.setMinutes(0, 0)
                      today.setSeconds(0, 0)
                      today.setMilliseconds(0)

                      let startDate = new Date(today)
                      let endDate = new Date(today)
                      let price = 0
                      let status = "ACTIVE"
                      let isFreeTrial = false

                      if (selectedSubscriptionPlan === "FREE_TRIAL") {
                        endDate.setDate(endDate.getDate() + 7) // 7 days free trial
                        status = "FREE_TRIAL"
                        isFreeTrial = true
                        price = 0
                      } else if (selectedSubscriptionPlan === "SIX_MONTH") {
                        endDate.setMonth(endDate.getMonth() + 6)
                        price = PLAN_PRICING.SIX_MONTH.price
                      } else if (selectedSubscriptionPlan === "TWELVE_MONTH") {
                        endDate.setMonth(endDate.getMonth() + 12)
                        price = PLAN_PRICING.TWELVE_MONTH.price
                      }

                      endDate.setHours(23, 59, 59, 999)

                      // Create or update subscription via API
                      const response = await fetch("/api/subscriptions", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          userId: selectedUserForSetSubscription.userId,
                          plan: selectedSubscriptionPlan === "FREE_TRIAL" ? "SIX_MONTH" : selectedSubscriptionPlan, // Use SIX_MONTH as base for free trial
                          status: status,
                          startDate: startDate.toISOString(),
                          endDate: endDate.toISOString(),
                          price: price,
                          paymentStatus: "APPROVED",
                          paymentId: `manual_${Date.now()}`,
                          isFreeTrial: isFreeTrial,
                        }),
                      })

                      if (!response.ok) {
                        const error = await response.json()
                        throw new Error(error.error || "Failed to set subscription")
                      }

                      const data = await response.json()
                      toast.success(`Subscription set successfully! ${selectedSubscriptionPlan === "FREE_TRIAL" ? "Free Trial" : selectedSubscriptionPlan === "SIX_MONTH" ? "6 Months" : "12 Months"} subscription activated.`)
                      
                      setIsSetSubscriptionDialogOpen(false)
                      setSelectedSubscriptionPlan(null)
                      loadUsers()
                    } catch (error: any) {
                      console.error("Error setting subscription:", error)
                      toast.error(error.message || "Failed to set subscription")
                    } finally {
                      setIsSettingSubscription(false)
                    }
                  }}
                  disabled={!selectedSubscriptionPlan || isSettingSubscription}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                >
                  {isSettingSubscription ? "Setting..." : "Set Subscription"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <UserDetailsDialog
          open={isUserDetailsDialogOpen}
          onOpenChange={setIsUserDetailsDialogOpen}
          userDetails={selectedUserForDetails}
          users={users}
        />

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-white border-blue-200 text-black">
            <DialogHeader>
              <DialogTitle className="text-black text-2xl">
                Edit User - {selectedUserForEdit?.userName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-black">
                    Full Name <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white border-blue-300 text-black"
                    required
                  />
                        </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-black">
                    Email <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-white border-blue-300 text-black"
                    required
                  />
                        </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-shopName" className="text-black">
                    Shop/Company Name
                  </Label>
                  <Input
                    id="edit-shopName"
                    value={editFormData.shopName}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, shopName: e.target.value }))}
                    className="bg-white border-blue-300 text-black"
                  />
                        </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactNumber" className="text-black">
                    Contact Number
                  </Label>
                  <Input
                    id="edit-contactNumber"
                    value={editFormData.contactNumber}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                    className="bg-white border-blue-300 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address" className="text-black">
                    Address
                  </Label>
                  <Input
                    id="edit-address"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address: e.target.value }))}
                    className="bg-white border-blue-300 text-black"
                    placeholder="Full address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-companyEmail" className="text-black">
                    Company Email
                  </Label>
                  <Input
                    id="edit-companyEmail"
                    type="email"
                    value={editFormData.companyEmail}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, companyEmail: e.target.value }))}
                    className="bg-white border-blue-300 text-black"
                    placeholder="company@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website" className="text-black">
                    Website
                  </Label>
                  <Input
                    id="edit-website"
                    type="url"
                    value={editFormData.website}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, website: e.target.value }))}
                    className="bg-white border-blue-300 text-black"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-blue-200">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1 border-blue-300 bg-white text-black hover:bg-blue-50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!selectedUserForEdit) return
                    
                    if (!editFormData.name || !editFormData.email) {
                      toast.error("Name and email are required")
                      return
                    }

                    try {
                      const response = await fetch("/api/users", {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          id: selectedUserForEdit.userId,
                          name: editFormData.name,
                          email: editFormData.email,
                          shopName: editFormData.shopName || null,
                          contactNumber: editFormData.contactNumber || null,
                          address: editFormData.address || null,
                          companyEmail: editFormData.companyEmail || null,
                          website: editFormData.website || null,
                        }),
                      })

                      if (response.ok) {
                        toast.success("User updated successfully!")
                        setIsEditDialogOpen(false)
                        await loadUsers()
                      } else {
                        const error = await response.json()
                        toast.error(error.error || "Failed to update user")
                      }
                    } catch (error) {
                      console.error("Error updating user:", error)
                      toast.error("Failed to update user")
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save Changes
                </Button>
                        </div>
                      </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent className="bg-white border-blue-200 text-black">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-black">Delete User</AlertDialogTitle>
              <AlertDialogDescription className="text-black">
                Are you sure you want to delete this user? This action cannot be undone and will permanently delete:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>User account and all associated data</li>
                  <li>User's subscription information</li>
                  <li>User's repair tickets and history</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => setUserToDelete(null)}
                className="border-blue-300 bg-white text-black hover:bg-blue-50"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (!userToDelete) return

                  setIsDeleting(true)
                  try {
                    const response = await fetch(`/api/users?id=${userToDelete}`, {
                      method: "DELETE",
                    })

                    if (response.ok) {
                      toast.success("User deleted successfully!")
                      setUserToDelete(null)
                      await loadUsers()
                    } else {
                      const error = await response.json()
                      toast.error(error.error || "Failed to delete user")
                    }
                  } catch (error) {
                    console.error("Error deleting user:", error)
                    toast.error("Failed to delete user")
                  } finally {
                    setIsDeleting(false)
                  }
                }}
                disabled={isDeleting}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SuperAdminLayout>
  )
}

