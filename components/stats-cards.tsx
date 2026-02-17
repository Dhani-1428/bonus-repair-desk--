"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"

export function StatsCards() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    notOk: 0,
    completed: 0,
    delivered: 0,
  })

  useEffect(() => {
    const updateStats = async () => {
      if (!user?.id) return
      
      try {
        // Load tickets from API instead of localStorage
        console.log(`[StatsCards] Fetching tickets for userId: ${user.id}`)
        const response = await fetch(`/api/repairs?userId=${user.id}`)
        console.log(`[StatsCards] API response status: ${response.status}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log(`[StatsCards] API response data:`, { 
            hasTickets: !!data.tickets, 
            ticketsCount: Array.isArray(data.tickets) ? data.tickets.length : 0,
            error: data.error 
          })
          
          const ticketsArray = Array.isArray(data.tickets) ? data.tickets : []
          console.log(`[StatsCards] Processing ${ticketsArray.length} tickets`)
          
          if (ticketsArray.length > 0) {
            console.log(`[StatsCards] Sample ticket statuses:`, ticketsArray.slice(0, 5).map((t: any) => ({ 
              id: t.id, 
              status: t.status, 
              deleted: t.deleted 
            })))
          }
          
          setStats({
            total: ticketsArray.length,
            pending: ticketsArray.filter((t: any) => {
              const status = (t.status || "").toLowerCase()
              return status === "pending" || status === "PENDING"
            }).length,
            notOk: ticketsArray.filter((t: any) => {
              const status = (t.status || "").toLowerCase()
              return status === "not_ok" || status === "NOT_OK" || status === "not ok"
            }).length,
            completed: ticketsArray.filter((t: any) => {
              const status = (t.status || "").toLowerCase()
              return status === "completed" || status === "COMPLETED"
            }).length,
            delivered: ticketsArray.filter((t: any) => {
              const status = (t.status || "").toLowerCase()
              return status === "delivered" || status === "DELIVERED"
            }).length,
          })
          
          console.log(`[StatsCards] Updated stats:`, {
            total: ticketsArray.length,
            pending: ticketsArray.filter((t: any) => (t.status || "").toLowerCase() === "pending").length,
            notOk: ticketsArray.filter((t: any) => {
              const s = (t.status || "").toLowerCase()
              return s === "not_ok" || s === "not ok"
            }).length,
            completed: ticketsArray.filter((t: any) => (t.status || "").toLowerCase() === "completed").length,
            delivered: ticketsArray.filter((t: any) => (t.status || "").toLowerCase() === "delivered").length,
          })
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error("[StatsCards] Failed to load tickets from API:", response.status, errorData)
          setStats({
            total: 0,
            pending: 0,
            notOk: 0,
            completed: 0,
            delivered: 0,
          })
        }
      } catch (error) {
        console.error("[StatsCards] Error fetching tickets:", error)
        // Set default stats on error
        setStats({
          total: 0,
          pending: 0,
          notOk: 0,
          completed: 0,
          delivered: 0,
        })
      }
    }
    updateStats()
    const interval = setInterval(updateStats, 5000) // Update every 5 seconds instead of 1
    return () => clearInterval(interval)
  }, [user?.id])

  const handleCardClick = (status?: string) => {
    if (!status || status === "all") {
      router.push("/tickets")
    } else if (status === "pending") {
      router.push("/tickets/pending")
    } else if (status === "not_ok") {
      router.push("/tickets/in-progress")
    } else if (status === "completed") {
      router.push("/tickets/completed")
    } else if (status === "delivered") {
      router.push("/tickets/out")
    }
  }

  return (
    <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      <Card
        className="shadow-lg border border-blue-200 dark:border-gray-800/50 bg-white dark:bg-gradient-to-br dark:from-gray-900/50 dark:via-black/50 dark:to-gray-900/50 dark:backdrop-blur-sm cursor-pointer hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative"
        onClick={() => handleCardClick("all")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10 bg-blue-50 dark:bg-gray-900/30 p-4 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-semibold text-black dark:text-white uppercase tracking-wide">
            {t("stats.totalDevices")}
          </CardTitle>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center shadow-md ring-2 ring-blue-200 dark:ring-gray-800/50">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">{stats.total}</div>
          <p className="text-xs text-black dark:text-gray-300 font-medium">{t("stats.allRepairDevices")}</p>
        </CardContent>
      </Card>

      <Card
        className="shadow-lg border-2 border-yellow-300 dark:border-yellow-700 bg-white dark:bg-gradient-to-br dark:from-gray-900/50 dark:via-black/50 dark:to-gray-900/50 dark:backdrop-blur-sm cursor-pointer hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative"
        onClick={() => handleCardClick("pending")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10 bg-yellow-50 dark:bg-gray-900/30 p-4 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-semibold text-black dark:text-white uppercase tracking-wide">
            {t("status.pending")}
          </CardTitle>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center shadow-md ring-2 ring-yellow-200 dark:ring-gray-800/50">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">{stats.pending}</div>
          <p className="text-xs text-black dark:text-gray-300 font-medium">{t("stats.awaitingService")}</p>
        </CardContent>
      </Card>

      <Card
        className="shadow-lg border-2 border-blue-300 dark:border-gray-800/50 bg-white dark:bg-gradient-to-br dark:from-gray-900/50 dark:via-black/50 dark:to-gray-900/50 dark:backdrop-blur-sm cursor-pointer hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative"
        onClick={() => handleCardClick("not_ok")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10 bg-blue-50 dark:bg-gray-900/30 p-4 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-semibold text-black dark:text-white uppercase tracking-wide">
            {t("status.notOk") || "Not OK"}
          </CardTitle>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center shadow-md ring-2 ring-blue-200 dark:ring-gray-800/50">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">{stats.notOk}</div>
          <p className="text-xs text-black dark:text-gray-300 font-medium">{t("stats.cannotRepaired") || "Cannot Repaired"}</p>
        </CardContent>
      </Card>

      <Card
        className="shadow-lg border-2 border-green-300 dark:border-green-700 bg-white dark:bg-gradient-to-br dark:from-gray-900/50 dark:via-black/50 dark:to-gray-900/50 dark:backdrop-blur-sm cursor-pointer hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-green-500/20 hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative"
        onClick={() => handleCardClick("completed")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10 bg-green-50 dark:bg-gray-900/30 p-4 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-semibold text-black dark:text-white uppercase tracking-wide">
            {t("status.completed")}
          </CardTitle>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center shadow-md ring-2 ring-green-200 dark:ring-gray-800/50">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">{stats.completed}</div>
          <p className="text-xs text-black dark:text-gray-300 font-medium">{t("stats.repairsFinished")}</p>
        </CardContent>
      </Card>

      <Card
        className="shadow-lg border border-blue-200 dark:border-gray-800/50 bg-white dark:bg-gradient-to-br dark:from-gray-900/50 dark:via-black/50 dark:to-gray-900/50 dark:backdrop-blur-sm cursor-pointer hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-300 group overflow-hidden relative"
        onClick={() => handleCardClick("delivered")}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10 bg-blue-50 dark:bg-gray-900/30 p-4 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-semibold text-black dark:text-white uppercase tracking-wide">
            {t("status.delivered")}
          </CardTitle>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-gray-800/50 rounded-xl flex items-center justify-center shadow-md ring-2 ring-blue-200 dark:ring-gray-800/50">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 p-4 sm:p-6">
          <div className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-1">{stats.delivered}</div>
          <p className="text-xs text-black dark:text-gray-300 font-medium">{t("stats.returnedToCustomers")}</p>
        </CardContent>
      </Card>
    </div>
  )
}

