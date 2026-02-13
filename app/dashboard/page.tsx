"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsCards } from "@/components/stats-cards"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { Building2, Mail, Phone, MapPin, Globe, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()
  const [userDetails, setUserDetails] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    
    // Redirect super admin to super admin panel
    const isSuperAdmin = 
      user.role === "SUPER_ADMIN" || 
      user.role === "super_admin" || 
      user.email === "superadmin@admin.com" ||
      user.email?.toLowerCase() === "superadmin@admin.com"
    
    if (isSuperAdmin) {
      router.replace("/super-admin")
      return
    }
    
    loadUserDetails()
  }, [user, router])

  const loadUserDetails = async () => {
    try {
      const response = await fetch(`/api/users?id=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setUserDetails(data.user)
      }
    } catch (error) {
      console.error("Error loading user details:", error)
    }
  }

  if (!user) return null

  const displayUser = userDetails || user

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 text-black">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-black">
            {t("dashboard.welcomeBack")} {user.name}!
          </h1>
          <p className="text-black text-base sm:text-lg font-medium">
            {t("dashboard.whatsHappening")}
          </p>
        </div>
        <StatsCards />
        
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-4">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black">
              {t("settings.accountCredentials")}
            </h2>
            <p className="text-black text-sm sm:text-base">
              {t("settings.credentialsDescription")}
            </p>
          </div>
          <Link href="/settings">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Settings className="w-4 h-4 mr-2" />
              {t("settings.editCredentials")}
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl border border-blue-200 bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-black">{t("settings.accountInformation")}</CardTitle>
            <CardDescription className="text-black text-sm sm:text-base">
              {t("settings.credentialsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("settings.name")}</p>
                  <p className="text-lg font-semibold text-black">{displayUser.name || t("common.notAvailable")}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{t("settings.email")}</p>
                  <p className="text-lg font-semibold text-black">{displayUser.email || t("common.notAvailable")}</p>
                </div>
              </div>

              {displayUser.shopName && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("settings.shopName")}</p>
                    <p className="text-lg font-semibold text-black">{displayUser.shopName}</p>
                  </div>
                </div>
              )}

              {displayUser.contactNumber && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("settings.contactNumber")}</p>
                    <p className="text-lg font-semibold text-black">{displayUser.contactNumber}</p>
                  </div>
                </div>
              )}

              {displayUser.address && (
                <div className="flex items-start gap-4 md:col-span-2">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">{t("settings.address")}</p>
                    <p className="text-lg font-semibold text-black">{displayUser.address}</p>
                  </div>
                </div>
              )}

              {displayUser.companyEmail && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("settings.companyEmail")}</p>
                    <p className="text-lg font-semibold text-black">{displayUser.companyEmail}</p>
                  </div>
                </div>
              )}

              {displayUser.website && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">{t("settings.website")}</p>
                    <p className="text-lg font-semibold text-black">{displayUser.website}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {t("settings.updateInstructions")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
