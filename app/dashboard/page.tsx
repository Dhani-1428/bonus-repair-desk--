"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RepairTicketList } from "@/components/repair-ticket-list"
import { StatsCards } from "@/components/stats-cards"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    if (!user) {
      router.push("/login")
    }
  }, [user, router])

  if (!user) return null

  return (
    <DashboardLayout>
      <div className="space-y-8 text-black">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-black">
            {t("dashboard.welcomeBack")} {user.name}!
          </h1>
          <p className="text-black text-lg font-medium">
            {t("dashboard.whatsHappening")}
          </p>
        </div>
        <StatsCards />
        <RepairTicketList />
      </div>
    </DashboardLayout>
  )
}
