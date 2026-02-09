"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SuperAdminLayout } from "@/components/super-admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { isSuperAdmin } from "@/lib/storage"
import { PLAN_PRICING } from "@/lib/constants"
import { toast } from "sonner"
import Link from "next/link"
import { Edit, Trash2, Plus, Users, ArrowLeft, CheckCircle } from "lucide-react"

interface UserWithSubscription {
  userId: string
  userName: string
  userEmail: string
  shopName?: string
  subscriptionId: string
  plan: string
  planName: string
  status: string
  startDate: string
  endDate: string
  price: number
  isFreeTrial: boolean
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()
  const [viewMode, setViewMode] = useState<"plans" | "active-users">("plans")
  const [activeUsers, setActiveUsers] = useState<UserWithSubscription[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [planPricing, setPlanPricing] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("plan_pricing")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (error) {
          console.error("Error parsing plan pricing:", error)
        }
      }
    }
    return PLAN_PRICING
  })
  const [isPlanEditDialogOpen, setIsPlanEditDialogOpen] = useState(false)
  const [isPlanAddDialogOpen, setIsPlanAddDialogOpen] = useState(false)
  const [planEditFormData, setPlanEditFormData] = useState<any>({})
  const [selectedPlan, setSelectedPlan] = useState<"THREE_MONTH" | "SIX_MONTH" | "TWELVE_MONTH" | null>(null)

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

    // Check if we should show active users view
    const showActiveUsers = searchParams?.get("view") === "active-users" || searchParams?.get("filter") === "active"
    setViewMode(showActiveUsers ? "active-users" : "plans")

    if (showActiveUsers) {
      loadActiveUsers()
    }
  }, [user, loading, router, searchParams])

  const loadActiveUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch("/api/subscriptions/all")
      if (response.ok) {
        const data = await response.json()
        const subscriptions = data.subscriptions || []
        
        // Filter for active subscriptions
        const activeSubs = subscriptions.filter((sub: any) => {
          const status = sub.status?.toUpperCase()
          return status === "ACTIVE" || status === "FREE_TRIAL"
        })

        // Map to user with subscription format
        const usersWithSubs: UserWithSubscription[] = activeSubs.map((sub: any) => ({
          userId: sub.userId || sub.user_id,
          userName: sub.user?.name || sub.user_name || "Unknown",
          userEmail: sub.user?.email || sub.user_email || "Unknown",
          shopName: sub.user?.shopName || sub.user_shopName,
          subscriptionId: sub.id,
          plan: sub.plan,
          planName: PLAN_PRICING[sub.plan]?.name || sub.plan,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          price: sub.price || PLAN_PRICING[sub.plan]?.price || 0,
          isFreeTrial: sub.isFreeTrial || sub.status?.toUpperCase() === "FREE_TRIAL",
        }))

        setActiveUsers(usersWithSubs)
      } else {
        toast.error("Failed to load active subscriptions")
      }
    } catch (error) {
      console.error("Error loading active users:", error)
      toast.error("Error loading active subscriptions")
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleEditPlan = (planKey: "THREE_MONTH" | "SIX_MONTH" | "TWELVE_MONTH") => {
    const plan = planPricing[planKey]
    setSelectedPlan(planKey)
    setPlanEditFormData({
      name: plan.name,
      price: plan.price,
      months: plan.months,
      features: plan.features.join("\n"),
    })
    setIsPlanEditDialogOpen(true)
  }

  const handleSavePlan = () => {
    if (!selectedPlan) return

    const features = planEditFormData.features
      .split("\n")
      .map((f: string) => f.trim())
      .filter((f: string) => f.length > 0)

    const updatedPricing = {
      ...planPricing,
      [selectedPlan]: {
        ...planPricing[selectedPlan],
        name: planEditFormData.name,
        price: Number.parseFloat(planEditFormData.price),
        months: Number.parseInt(planEditFormData.months),
        features,
      },
    }

    setPlanPricing(updatedPricing)
    localStorage.setItem("plan_pricing", JSON.stringify(updatedPricing))
    setIsPlanEditDialogOpen(false)
    toast.success("Plan updated successfully!")
  }

  const handleDeletePlan = (planKey: "THREE_MONTH" | "SIX_MONTH" | "TWELVE_MONTH") => {
    // Check if any users are using this plan
    const allSubscriptions = JSON.parse(localStorage.getItem("subscriptions") || "[]")
    const usersWithPlan = allSubscriptions.filter((sub: any) => sub.plan === planKey)
    
    if (usersWithPlan.length > 0) {
      toast.error(`Cannot delete plan. ${usersWithPlan.length} user(s) are currently using this plan.`)
      return
    }

    const updatedPricing = { ...planPricing }
    delete updatedPricing[planKey]
    
    setPlanPricing(updatedPricing)
    localStorage.setItem("plan_pricing", JSON.stringify(updatedPricing))
    toast.success("Plan deleted successfully!")
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
    <SuperAdminLayout>
      <div className="space-y-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Subscription Plans</h1>
            <p className="text-gray-300">Manage subscription plans offered to users</p>
          </div>
          <Link href="/super-admin">
            <Button variant="outline" className="border-gray-700 bg-gray-900/50 text-white hover:bg-gray-800">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {viewMode === "active-users" ? (
          <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-gray-800/50 rounded-t-lg px-6 py-4">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Active Subscriptions ({activeUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="ml-4 text-gray-300">Loading active subscriptions...</p>
                </div>
              ) : activeUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No active subscriptions found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeUsers.map((userSub) => (
                    <div
                      key={userSub.subscriptionId}
                      className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-green-500/50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">{userSub.userName}</h3>
                            <Badge className={userSub.isFreeTrial ? "bg-yellow-600/20 text-yellow-400 border-yellow-500/30" : "bg-green-600/20 text-green-400 border-green-500/30"}>
                              {userSub.isFreeTrial ? "Free Trial" : "Active"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-1">{userSub.userEmail}</p>
                          {userSub.shopName && (
                            <p className="text-sm text-gray-500 mb-3">Shop: {userSub.shopName}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Subscription Plan</p>
                              <p className="text-sm font-semibold text-white">{userSub.planName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Price</p>
                              <p className="text-sm font-semibold text-white">€{userSub.price.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Start Date</p>
                              <p className="text-sm text-gray-300">
                                {new Date(userSub.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">End Date</p>
                              <p className="text-sm text-gray-300">
                                {new Date(userSub.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-white">Available Plans</CardTitle>
              <Button
                onClick={() => {
                  setSelectedPlan(null)
                  setPlanEditFormData({
                    name: "",
                    price: "",
                    months: "",
                    features: "",
                  })
                  setIsPlanAddDialogOpen(true)
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(planPricing).map(([key, plan]: [string, any]) => (
                <Card key={key} className="border-2 border-gray-700 bg-gray-800/50 hover:border-blue-500/50 transition-all">
                  <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
                    <CardTitle className="text-lg text-white">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-3xl font-bold text-white">€{plan.price}</p>
                        <p className="text-sm text-gray-400">for {plan.months} month(s)</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-300 mb-2">Features:</p>
                        <ul className="space-y-1 text-sm text-gray-400">
                          {plan.features.map((feature: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEditPlan(key as "THREE_MONTH" | "SIX_MONTH" | "TWELVE_MONTH")}
                          className="flex-1 border-gray-600 bg-gray-800/50 text-white hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-red-600/50 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:border-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-gray-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Plan</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                Are you sure you want to delete the <strong>{plan.name}</strong> plan?
                                This action cannot be undone. Make sure no users are currently using this plan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeletePlan(key as "THREE_MONTH" | "SIX_MONTH" | "TWELVE_MONTH")}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit Plan Dialog */}
        <Dialog open={isPlanEditDialogOpen} onOpenChange={setIsPlanEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-white border-blue-200 text-black">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-name" className="text-white">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={planEditFormData.name || ""}
                  onChange={(e) => setPlanEditFormData({ ...planEditFormData, name: e.target.value })}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-price" className="text-white">Price (€)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  step="0.01"
                  value={planEditFormData.price || ""}
                  onChange={(e) =>
                    setPlanEditFormData({ ...planEditFormData, price: e.target.value })
                  }
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-months" className="text-white">Duration (Months)</Label>
                <Input
                  id="plan-months"
                  type="number"
                  value={planEditFormData.months || ""}
                  onChange={(e) =>
                    setPlanEditFormData({ ...planEditFormData, months: e.target.value })
                  }
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-features" className="text-white">Features (one per line)</Label>
                <Textarea
                  id="plan-features"
                  value={planEditFormData.features || ""}
                  onChange={(e) =>
                    setPlanEditFormData({ ...planEditFormData, features: e.target.value })
                  }
                  className="bg-gray-800/50 border-gray-700 text-white min-h-[120px]"
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPlanEditDialogOpen(false)}
                  className="border-gray-700 bg-gray-800/50 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button onClick={handleSavePlan} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Plan Dialog - Similar structure but for adding new plans */}
        <Dialog open={isPlanAddDialogOpen} onOpenChange={setIsPlanAddDialogOpen}>
          <DialogContent className="max-w-2xl bg-white border-blue-200 text-black">
            <DialogHeader>
              <DialogTitle className="text-white">Add New Subscription Plan</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-plan-key" className="text-white">Plan Key (e.g., SIX_MONTH)</Label>
                <Input
                  id="new-plan-key"
                  value={planEditFormData.key || ""}
                  onChange={(e) => setPlanEditFormData({ ...planEditFormData, key: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                  className="bg-gray-800/50 border-gray-700 text-white"
                  placeholder="SIX_MONTH"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-plan-name" className="text-white">Plan Name</Label>
                <Input
                  id="new-plan-name"
                  value={planEditFormData.name || ""}
                  onChange={(e) => setPlanEditFormData({ ...planEditFormData, name: e.target.value })}
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-plan-price" className="text-white">Price (€)</Label>
                <Input
                  id="new-plan-price"
                  type="number"
                  step="0.01"
                  value={planEditFormData.price || ""}
                  onChange={(e) =>
                    setPlanEditFormData({ ...planEditFormData, price: e.target.value })
                  }
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-plan-months" className="text-white">Duration (Months)</Label>
                <Input
                  id="new-plan-months"
                  type="number"
                  value={planEditFormData.months || ""}
                  onChange={(e) =>
                    setPlanEditFormData({ ...planEditFormData, months: e.target.value })
                  }
                  className="bg-gray-800/50 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-plan-features" className="text-white">Features (one per line)</Label>
                <Textarea
                  id="new-plan-features"
                  value={planEditFormData.features || ""}
                  onChange={(e) =>
                    setPlanEditFormData({ ...planEditFormData, features: e.target.value })
                  }
                  className="bg-gray-800/50 border-gray-700 text-white min-h-[120px]"
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsPlanAddDialogOpen(false)}
                  className="border-gray-700 bg-gray-800/50 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!planEditFormData.key || !planEditFormData.name || !planEditFormData.price || !planEditFormData.months) {
                      toast.error("Please fill in all required fields")
                      return
                    }
                    const features = planEditFormData.features
                      .split("\n")
                      .map((f: string) => f.trim())
                      .filter((f: string) => f.length > 0)
                    const updatedPricing = {
                      ...planPricing,
                      [planEditFormData.key]: {
                        name: planEditFormData.name,
                        price: Number.parseFloat(planEditFormData.price),
                        months: Number.parseInt(planEditFormData.months),
                        features,
                      },
                    }
                    setPlanPricing(updatedPricing)
                    localStorage.setItem("plan_pricing", JSON.stringify(updatedPricing))
                    setIsPlanAddDialogOpen(false)
                    toast.success("Plan added successfully!")
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  Add Plan
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  )
}
