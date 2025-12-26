"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { TeamManagement } from "@/components/team-management"
import { useTranslation } from "@/components/language-provider"

export default function TeamPage() {
  const { t } = useTranslation()

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance text-black">
            {t("team.page.title")}
          </h1>
          <p className="text-black text-balance">{t("team.page.subtitle")}</p>
        </div>
        <TeamManagement />
      </div>
    </DashboardLayout>
  )
}

