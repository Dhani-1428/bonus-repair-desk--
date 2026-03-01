"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SuperAdminLayout } from "@/components/super-admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { getAllUsers } from "@/lib/storage"
import { getAllSubscriptions, getExpiringSubscriptions, getSubscriptionEndDate } from "@/lib/subscription-utils"
import { isSuperAdmin } from "@/lib/storage"
import { PLAN_PRICING } from "@/lib/constants"
import Link from "next/link"
import { toast } from "sonner"

export default function SuperAdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
    totalRevenue: 0,
  })

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

    loadData()
    checkExpiringSubscriptions()

    const interval = setInterval(() => {
      checkExpiringSubscriptions()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user, loading, router])

  const loadData = async () => {
    let allUsers: any[] = []
    
    try {
      // Fetch users from API
      const usersResponse = await fetch("/api/users")
      if (usersResponse.ok) {
        const data = await usersResponse.json()
        // Show ALL users including super admins
        allUsers = data.users || []
        setUsers(allUsers)
      } else {
        // Fallback to API function
        allUsers = await getAllUsers()
        // Show ALL users including super admins
        setUsers(allUsers)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      // Fallback to API function
      allUsers = await getAllUsers()
      // Show ALL users including super admins
      setUsers(allUsers)
    }
    
    // Fetch subscriptions from API
    try {
      const subsResponse = await fetch("/api/subscriptions/all")
      if (subsResponse.ok) {
        const data = await subsResponse.json()
        const allSubs = data.subscriptions || []
        setSubscriptions(allSubs)

        const activeSubs = allSubs.filter((s: any) => s.status === "ACTIVE" || s.status === "active")
        const totalRevenue = activeSubs.reduce((sum: number, s: any) => {
          return sum + (PLAN_PRICING[s.plan]?.price || 0)
        }, 0)

        setStats({
          totalUsers: allUsers.length,
          activeSubscriptions: activeSubs.length,
          expiringSubscriptions: 0, // Will be set by checkExpiringSubscriptions
          totalRevenue,
        })
      } else {
        // Fallback - set empty stats
        setSubscriptions([])
        setStats({
          totalUsers: allUsers.length,
          activeSubscriptions: 0,
          expiringSubscriptions: 0,
          totalRevenue: 0,
        })
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error)
      setSubscriptions([])
      setStats({
        totalUsers: allUsers.length,
        activeSubscriptions: 0,
        expiringSubscriptions: 0,
        totalRevenue: 0,
      })
    }
  }

  const checkExpiringSubscriptions = async () => {
    try {
      // Fetch subscriptions from API and check for expiring ones
      const subsResponse = await fetch("/api/subscriptions/all")
      if (subsResponse.ok) {
        const data = await subsResponse.json()
        const allSubs = data.subscriptions || []
        
        const today = new Date()
        const sevenDaysFromNow = new Date()
        sevenDaysFromNow.setDate(today.getDate() + 7)
        
        const expiring = allSubs.filter((sub: any) => {
          const endDate = new Date(sub.endDate)
          return endDate >= today && endDate <= sevenDaysFromNow
        })
        
        setExpiringSubscriptions(expiring)
        setStats((prev) => ({ ...prev, expiringSubscriptions: expiring.length }))
      }
    } catch (error) {
      console.error("Error checking expiring subscriptions:", error)
    }

    // Email notifications are now handled automatically by the subscription-notifications system
    // which runs in the dashboard layout component
  }

  const runUsersTableMigration = async () => {
    try {
      toast.loading("Running migration...", { id: "migration" })
      
      const response = await fetch("/api/migrate/users-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Migration completed successfully!", { id: "migration" })
        console.log("[SuperAdmin] Migration result:", data)
      } else {
        toast.error(data.error || "Migration failed", { id: "migration" })
      }
    } catch (error: any) {
      console.error("[SuperAdmin] Migration error:", error)
      toast.error("Failed to run migration: " + (error.message || "Unknown error"), { id: "migration" })
    }
  }

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
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Super Admin Dashboard</h1>
            <p className="text-gray-300">Overview of all users, subscriptions, and system status</p>
          </div>

        {/* Stats Cards */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/super-admin/users">
            <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg">
                <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-white mb-1">{stats.totalUsers}</div>
                <p className="text-xs text-gray-400">Registered users</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/super-admin/subscriptions">
            <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl hover:border-green-500/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-gray-800/50 rounded-t-lg">
                <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Active Subscriptions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-white mb-1">{stats.activeSubscriptions}</div>
                <p className="text-xs text-gray-400">Currently active</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/super-admin/subscriptions?filter=expiring">
            <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl hover:border-yellow-500/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <CardHeader className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-b border-gray-800/50 rounded-t-lg">
                <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Expiring Soon
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-white mb-1">{stats.expiringSubscriptions}</div>
                <p className="text-xs text-gray-400">Within 7 days</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/super-admin/analytics">
            <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <CardHeader className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-gray-800/50 rounded-t-lg">
                <CardTitle className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-4xl font-bold text-white mb-1">€{stats.totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-gray-400">From active subscriptions</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Expiring Subscriptions Alert */}
        {expiringSubscriptions.length > 0 && (
          <Card className="shadow-2xl border border-red-500/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm animate-fade-in-up hover:shadow-red-500/20 transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-red-600/20 to-red-700/20 border-b border-gray-800/50">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Expiring Subscriptions ({expiringSubscriptions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2 mb-4">
                {expiringSubscriptions.slice(0, 3).map((sub: any, index: number) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-red-500/50 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fade-in-up"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div>
                      <p className="font-semibold text-white">{sub.user.name}</p>
                      <p className="text-sm text-gray-300">{sub.user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {PLAN_PRICING[sub.plan]?.name || sub.plan} - €{sub.price}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Expires: {getSubscriptionEndDate(sub).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
                      {sub.daysUntilExpiration < 0
                        ? "Expired"
                        : sub.daysUntilExpiration === 0
                        ? "Expires Today"
                        : `${sub.daysUntilExpiration} day(s) left`}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-lg border border-blue-700/30 shadow-sm">
                <p className="text-sm text-blue-300">
                  <strong>Email notifications</strong> sent to{" "}
                  <strong className="text-blue-200">bonusrepairdesk@gmail.com</strong> with user details and subscription amounts.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-5 md:grid-cols-2">
          <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Users Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-300 mb-4">
                View and manage all users, their data, and subscription details.
              </p>
              <Link href="/super-admin/users">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  View All Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Subscription Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-300 mb-4">
                Manage subscription plans, edit pricing, and configure features.
              </p>
              <Link href="/super-admin/subscriptions">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Manage Plans
                </Button>
              </Link>
            </CardContent>
          </Card>


          <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
            <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Payment Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-300 mb-4">
                Review and approve pending subscription payments from users.
              </p>
              <Link href="/super-admin/payments">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Manage Payments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
            <CardHeader className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-gray-800/50 rounded-t-lg">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Database Migration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-300 mb-4">
                Add company information columns (address, companyEmail, website) to the users table.
              </p>
              <Button 
                onClick={runUsersTableMigration}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Run Users Table Migration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  )
}
