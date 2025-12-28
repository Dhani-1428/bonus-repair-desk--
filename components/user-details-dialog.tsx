"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAllSubscriptions, getSubscriptionEndDate } from "@/lib/subscription-utils"
import { PLAN_PRICING } from "@/lib/constants"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userDetails: any
  users: any[]
}

export function UserDetailsDialog({ open, onOpenChange, userDetails, users }: UserDetailsDialogProps) {
  const [loginHistory, setLoginHistory] = useState<any[]>([])
  const [tenantMembers, setTenantMembers] = useState<any[]>([])
  const [userPayments, setUserPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const user = users.find((u: any) => u.id === userDetails?.userId)

  useEffect(() => {
    if (!open || !userDetails) return

    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch login history
        const loginResponse = await fetch(`/api/login-history?userId=${userDetails.userId}`)
        if (loginResponse.ok) {
          const loginData = await loginResponse.json()
          setLoginHistory(Array.isArray(loginData.history) ? loginData.history : [])
        }

        // Fetch tenant data (only team members, not repair tickets)
        if (user?.tenantId) {
          const tenantResponse = await fetch(`/api/super-admin/tenants/${user.tenantId}`)
          if (tenantResponse.ok) {
            const tenantData = await tenantResponse.json()
            setTenantMembers(Array.isArray(tenantData.data?.teamMembers) ? tenantData.data.teamMembers : [])
          }
        }

        // Fetch payment requests
        const paymentsResponse = await fetch("/api/payments")
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json()
          const payments = Array.isArray(paymentsData.payments) ? paymentsData.payments : []
          setUserPayments(payments.filter((p: any) => p.userId === userDetails.userId))
        }
      } catch (error) {
        console.error("Error fetching user details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [open, userDetails, user?.tenantId])

  if (!userDetails) return null

  const allSubscriptions = getAllSubscriptions()
  const userSub = allSubscriptions.find((s: any) => s.userId === userDetails.userId)
  const allUserSubscriptions = userSub ? [userSub] : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white border-blue-200 max-h-[90vh] overflow-y-auto text-black">
        <DialogHeader>
          <DialogTitle className="text-black text-2xl">
            User Details - {userDetails.userName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User Information */}
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle className="text-black">User Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-black">Full Name</p>
                    <p className="text-sm text-black font-semibold">{userDetails.userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Email</p>
                    <p className="text-sm text-black font-semibold">{userDetails.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Shop Name</p>
                    <p className="text-sm text-black">{userDetails.shopName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Signup Date</p>
                    <p className="text-sm text-black">{new Date(userDetails.signupDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Last Login</p>
                    <p className="text-sm text-black">{userDetails.lastLogin ? new Date(userDetails.lastLogin).toLocaleString() : "Never"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black">Total Logins</p>
                    <p className="text-sm text-black font-semibold">{userDetails.totalLogins}</p>
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* Team Members */}
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle className="text-black">
                  Team Members ({tenantMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenantMembers.length === 0 ? (
                  <p className="text-black text-sm">No team members found</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {tenantMembers.map((member: any) => (
                      <div key={member.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-semibold text-black">{member.name}</p>
                        <p className="text-xs text-black">{member.email} | {member.role}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Login History */}
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle className="text-black">Login History</CardTitle>
              </CardHeader>
              <CardContent>
                {loginHistory.length === 0 ? (
                  <p className="text-black text-sm">No login history available</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {loginHistory.slice(0, 10).map((login: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                        <div>
                          <p className="text-sm text-black">{new Date(login.timestamp).toLocaleString()}</p>
                          <p className="text-xs text-black">IP: {login.ip || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Subscription History */}
            <Card className="border-blue-200 bg-white">
              <CardHeader>
                <CardTitle className="text-black">Subscription History</CardTitle>
              </CardHeader>
              <CardContent>
                {allUserSubscriptions.length === 0 && userPayments.length === 0 ? (
                  <p className="text-black text-sm">No subscription history</p>
                ) : (
                  <div className="space-y-3">
                    {allUserSubscriptions.map((sub: any, index: number) => (
                      <div key={`${sub.id}_${index}`} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-black">
                              {PLAN_PRICING[sub.plan]?.name || sub.plan}
                              {index === 0 && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                            </p>
                            <p className="text-xs text-black">
                              {sub.isFreeTrial ? "Free Trial" : `€${PLAN_PRICING[sub.plan]?.price || 0}`}
                            </p>
                          </div>
                          <Badge
                            className={
                              sub.status === "ACTIVE" || sub.status === "active"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : sub.status === "FREE_TRIAL" || sub.status === "free_trial"
                                ? "bg-blue-100 text-blue-700 border-blue-300"
                                : sub.status === "PENDING" || sub.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                : sub.status === "EXPIRED" || sub.status === "expired"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }
                          >
                            {sub.status === "FREE_TRIAL" || sub.status === "free_trial" ? "Free Trial" : sub.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-black">Start Date</p>
                            <p className="text-black">{new Date(sub.startDate).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-black">End Date</p>
                            <p className="text-black">{getSubscriptionEndDate(sub).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {userPayments.map((payment: any) => (
                      <div key={payment.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-black">{payment.planName}</p>
                            <p className="text-xs text-black">€{payment.price}</p>
                          </div>
                          <Badge
                            className={
                              payment.status === "APPROVED" || payment.status === "approved"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : payment.status === "PENDING" || payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                                : "bg-red-100 text-red-700 border-red-300"
                            }
                          >
                            {payment.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-black">Submitted</p>
                            <p className="text-black">{new Date(payment.createdAt).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-black">Payment ID</p>
                            <p className="text-black font-mono text-xs">{payment.id}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

