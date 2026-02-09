"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// Removed DashboardLayout to use website UI styling
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { getAllUsers } from "@/lib/storage"
import { getAllSubscriptions, isExpired, getDaysUntilExpiration } from "@/lib/subscription-utils"
import { PLAN_PRICING } from "@/lib/constants"
import { isSuperAdmin } from "@/lib/storage"
import Link from "next/link"
import { BarChart3, Users, DollarSign, TrendingUp, Calendar, Activity } from "lucide-react"

export default function SuperAdminAnalyticsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [analytics, setAnalytics] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalRevenueFromSubscriptions: 0,
    expiringSubscriptions: 0,
    usersByPlan: {} as Record<string, number>,
    revenueByPlan: {} as Record<string, number>,
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

    loadAnalytics()
  }, [user, loading, router])

  const loadAnalytics = async () => {
    try {
      const allUsers = (await getAllUsers()).filter((u: any) => u.role !== "super_admin")
      const allSubscriptions = getAllSubscriptions()
      const activeSubs = allSubscriptions.filter((s: any) => s.status === "active" && !isExpired(s))
      const expiringSubs = allSubscriptions.filter((s: any) => {
        const days = getDaysUntilExpiration(s)
        return days >= 0 && days <= 7
      })

      const usersByPlan: Record<string, number> = {}
      const revenueByPlan: Record<string, number> = {}

      // Process users and their subscriptions
      allUsers.forEach((u: any) => {
        const userSub = allSubscriptions.find((s: any) => s.userId === u.id)
        if (userSub) {
          const planName = PLAN_PRICING[userSub.plan]?.name || userSub.plan
          usersByPlan[planName] = (usersByPlan[planName] || 0) + 1
          revenueByPlan[planName] = (revenueByPlan[planName] || 0) + (PLAN_PRICING[userSub.plan]?.price || 0)
        }
      })

      const totalRevenueFromSubscriptions = activeSubs.reduce((sum: number, s: any) => {
        return sum + (PLAN_PRICING[s.plan]?.price || 0)
      }, 0)

      setAnalytics({
        totalUsers: allUsers.length,
        activeSubscriptions: activeSubs.length,
        totalRevenue: totalRevenueFromSubscriptions,
        totalRevenueFromSubscriptions,
        expiringSubscriptions: expiringSubs.length,
        usersByPlan,
        revenueByPlan,
      })
    } catch (error) {
      console.error("[Analytics] Error loading analytics:", error)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSuperAdmin()) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Analytics Dashboard</h1>
            <p className="text-gray-300">Comprehensive insights and statistics</p>
          </div>
          <Link href="/super-admin">
            <Button variant="outline" className="border-gray-700 bg-gray-900/50 text-white hover:bg-gray-800">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 border-b border-gray-800/50">
              <CardTitle className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-white mb-1">{analytics.totalUsers}</div>
              <p className="text-xs text-gray-400">Registered users</p>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600/20 to-green-700/20 border-b border-gray-800/50">
              <CardTitle className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-white mb-1">{analytics.activeSubscriptions}</div>
              <p className="text-xs text-gray-400">Currently active</p>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-600/20 to-purple-700/20 border-b border-gray-800/50">
              <CardTitle className="text-sm font-semibold text-gray-300 uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-white mb-1">€{analytics.totalRevenue}</div>
              <p className="text-xs text-gray-400">From active subscriptions</p>
            </CardContent>
          </Card>

        </div>

        {/* Detailed Analytics */}
        <div className="grid gap-6 md:grid-cols-1">
          {/* Users by Plan */}
          <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users by Subscription Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {Object.keys(analytics.usersByPlan).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No subscription data available</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(analytics.usersByPlan).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                      <div>
                        <p className="font-semibold text-white">{plan}</p>
                        <p className="text-sm text-gray-400">€{analytics.revenueByPlan[plan] || 0} revenue</p>
                      </div>
                      <div className="text-2xl font-bold text-white">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Expiring Subscriptions Alert */}
        {analytics.expiringSubscriptions > 0 && (
          <Card className="shadow-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 via-black/95 to-yellow-900/20 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-yellow-600/20 to-yellow-700/20 border-b border-yellow-500/30">
              <CardTitle className="text-xl text-yellow-400 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Expiring Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-yellow-300">
                <strong>{analytics.expiringSubscriptions}</strong> subscription(s) will expire within 7 days.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

