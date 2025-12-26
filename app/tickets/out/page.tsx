"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { SearchRepairTickets } from "@/components/search-repair-tickets"
import { useTranslation } from "@/components/language-provider"

export default function OutTicketsPage() {
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance text-black">
            {t("status.delivered")} {t("page.tickets.title")}
          </h1>
          <p className="text-black text-balance">
            {t("page.tickets.subtitle")}
          </p>
        </div>
        <SearchRepairTickets initialStatusFilter="delivered" />
      </div>
    </DashboardLayout>
  )
}

