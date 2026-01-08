"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
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
      <div className="space-y-8 text-black">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-black">
              {t("dashboard.welcomeBack")} {user.name}!
            </h1>
            <p className="text-black text-lg font-medium">
              Your Account Credentials
            </p>
          </div>
          <Link href="/settings">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Settings className="w-4 h-4 mr-2" />
              Edit Credentials
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl border border-blue-200 bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg">
            <CardTitle className="text-2xl text-black">Account Information</CardTitle>
            <CardDescription className="text-black">
              These details are used on your receipts and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-lg font-semibold text-black">{displayUser.name || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-lg font-semibold text-black">{displayUser.email || "N/A"}</p>
                </div>
              </div>

              {displayUser.shopName && (
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Shop Name</p>
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
                    <p className="text-sm font-medium text-gray-500">Contact Number</p>
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
                    <p className="text-sm font-medium text-gray-500">Address</p>
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
                    <p className="text-sm font-medium text-gray-500">Company Email</p>
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
                    <p className="text-sm font-medium text-gray-500">Website</p>
                    <p className="text-lg font-semibold text-black">{displayUser.website}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                To update these credentials, click the "Edit Credentials" button above. 
                You'll need to enter your password to make changes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
