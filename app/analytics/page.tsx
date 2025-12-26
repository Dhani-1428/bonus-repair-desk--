"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [analytics, setAnalytics] = useState({
    totalDevices: 0,
    totalRevenue: 0,
    averagePrice: 0,
    statusDistribution: {
      pending: 0,
      inProgress: 0,
      completed: 0,
      delivered: 0,
    },
    recentDevices: [] as any[],
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  useEffect(() => {
    const updateAnalytics = async () => {
      if (!user?.id) return
      
      try {
        // Load tickets from API instead of localStorage
        const response = await fetch(`/api/repairs?userId=${user.id}`)
        if (!response.ok) {
          console.error("[Analytics] Failed to load tickets from API")
          return
        }
        
        const data = await response.json()
        const ticketsArray = Array.isArray(data.tickets) ? data.tickets : []
        
        const totalRevenue = ticketsArray.reduce((sum: number, ticket: any) => {
          return sum + (parseFloat(ticket.price) || 0)
        }, 0)

        const averagePrice = ticketsArray.length > 0 ? totalRevenue / ticketsArray.length : 0

        const statusDistribution = {
          pending: ticketsArray.filter((t: any) => t.status === "PENDING" || t.status === "pending").length,
          inProgress: ticketsArray.filter((t: any) => t.status === "IN_PROGRESS" || t.status === "in_progress").length,
          completed: ticketsArray.filter((t: any) => t.status === "COMPLETED" || t.status === "completed").length,
          delivered: ticketsArray.filter((t: any) => t.status === "DELIVERED" || t.status === "delivered").length,
        }

        const recentDevices = ticketsArray
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)

        setAnalytics({
          totalDevices: ticketsArray.length,
          totalRevenue,
          averagePrice,
          statusDistribution,
          recentDevices,
        })
      } catch (error) {
        console.error("[Analytics] Error fetching tickets:", error)
        // Set default analytics on error
        setAnalytics({
          totalDevices: 0,
          totalRevenue: 0,
          averagePrice: 0,
          statusDistribution: {
            pending: 0,
            inProgress: 0,
            completed: 0,
            delivered: 0,
          },
          recentDevices: [],
        })
      }
    }

    updateAnalytics()
    const interval = setInterval(updateAnalytics, 5000) // Update every 5 seconds instead of 1
    return () => clearInterval(interval)
  }, [user?.id])

  if (!user) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-300"
      case "completed":
        return "bg-green-100 text-green-700 border-green-300"
      case "delivered":
        return "bg-purple-100 text-purple-700 border-purple-300"
      default:
        return "bg-gray-100 text-gray-700 border-gray-300"
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">{t("analytics.title")}</h1>
          <p className="text-black">{t("analytics.subtitle")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="shadow-xl border border-blue-200 bg-white">
            <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg">
              <CardTitle className="text-sm font-semibold text-black uppercase tracking-wide flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t("analytics.totalDevices")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-1">{analytics.totalDevices}</div>
              <p className="text-xs text-black">{t("analytics.allRepairDevices")}</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border border-blue-200 bg-white">
            <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg">
              <CardTitle className="text-sm font-semibold text-black uppercase tracking-wide flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("analytics.totalRevenue")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-1">€{Number.parseFloat(analytics.totalRevenue || 0).toFixed(2)}</div>
              <p className="text-xs text-black">{t("analytics.fromAllCompleted")}</p>
            </CardContent>
          </Card>

          <Card className="shadow-xl border border-blue-200 bg-white">
            <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg">
              <CardTitle className="text-sm font-semibold text-black uppercase tracking-wide flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t("analytics.averagePrice")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-4xl font-bold text-black mb-1">€{Number.parseFloat(analytics.averagePrice || 0).toFixed(2)}</div>
              <p className="text-xs text-black">{t("analytics.perDeviceRepair")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <Card className="shadow-xl border border-blue-200 bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-black flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t("analytics.statusDistribution")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-700 mb-1">{analytics.statusDistribution.pending}</div>
                <p className="text-sm text-black">{t("analytics.pending")}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-3xl font-bold text-blue-700 mb-1">{analytics.statusDistribution.inProgress}</div>
                <p className="text-sm text-black">{t("analytics.inProgress")}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-3xl font-bold text-green-700 mb-1">{analytics.statusDistribution.completed}</div>
                <p className="text-sm text-black">{t("analytics.completed")}</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                <div className="text-3xl font-bold text-purple-700 mb-1">{analytics.statusDistribution.delivered}</div>
                <p className="text-sm text-black">{t("analytics.delivered")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Devices */}
        <Card className="shadow-xl border border-blue-200 bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg">
            <CardTitle className="text-2xl font-bold text-black flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("analytics.recentDevices")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {analytics.recentDevices.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-black">{t("analytics.noDevicesYet")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.recentDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 border-2 border-blue-200 rounded-xl bg-white hover:bg-blue-50 transition-all shadow-md hover:shadow-lg hover:border-blue-300"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {device.customerName?.charAt(0).toUpperCase() || "D"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg text-black">{device.customerName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(device.status)}`}>
                            {device.status === "PENDING" || device.status === "pending" ? t("analytics.pending") :
                             device.status === "IN_PROGRESS" || device.status === "in_progress" ? t("analytics.inProgress") :
                             device.status === "COMPLETED" || device.status === "completed" ? t("analytics.completed") :
                             device.status === "DELIVERED" || device.status === "delivered" ? t("analytics.delivered") :
                             device.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-black">
                          <span>{device.model}</span>
                          <span>•</span>
                          <span className="font-mono text-xs">{device.imeiNo}</span>
                          <span>•</span>
                          <span className="font-bold text-black">€{device.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-black">
                        {new Date(device.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

