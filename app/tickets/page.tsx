"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { SearchRepairTickets } from "@/components/search-repair-tickets"
import { useTranslation } from "@/components/language-provider"

export default function TicketsPage() {
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 text-black dark:text-white">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance text-black dark:text-white">
            {t("page.tickets.title")}
          </h1>
          <p className="text-black dark:text-gray-300 text-balance text-sm sm:text-base">
            {t("page.tickets.subtitle")}
          </p>
        </div>
        <SearchRepairTickets />
      </div>
    </DashboardLayout>
  )
}

