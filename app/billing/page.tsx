"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { PLAN_PRICING, type SubscriptionPlan } from "@/lib/constants"
import { toast } from "sonner"
import { CheckCircle, Smartphone, Copy, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, subscription, updateSubscription } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [showMbwayModal, setShowMbwayModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get plan from URL query parameter
  useEffect(() => {
    try {
      const planParam = searchParams.get("plan")
      if (planParam && ["SIX_MONTH", "TWELVE_MONTH"].includes(planParam)) {
        setSelectedPlan(planParam as SubscriptionPlan)
      }
    } catch (err: any) {
      console.error("[Billing] Error parsing plan param:", err)
      setError(err?.message || "Failed to load billing page")
    }
  }, [searchParams])

  // Redirect if not logged in
  useEffect(() => {
    try {
      if (!user) {
        router.push("/login")
      }
    } catch (err: any) {
      console.error("[Billing] Error checking user:", err)
      setError(err?.message || "Failed to check authentication")
    }
  }, [user, router])

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-6 text-white p-6">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Billing Page</h2>
            <p className="text-gray-300">{error}</p>
            <Button
              onClick={() => {
                setError(null)
                window.location.reload()
              }}
              className="mt-4"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  const handlePayment = () => {
    if (!selectedPlan) {
      toast.error("Please select a subscription plan")
      return
    }
    // Show MBWay payment modal
    setShowMbwayModal(true)
  }

  const handleConfirmPayment = async () => {
    if (!selectedPlan) {
      return
    }

    setLoading(true)
    setShowMbwayModal(false)

    try {
      const planDetails = PLAN_PRICING[selectedPlan]
      if (!planDetails) {
        throw new Error("Invalid plan selected")
      }

      // Calculate start date: if user has free trial, start after trial ends
      // Otherwise, start immediately or after current subscription ends
      let startDate: Date
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      today.setMinutes(0, 0)
      today.setSeconds(0, 0)
      today.setMilliseconds(0)
      
      if (subscription && (subscription.isFreeTrial || subscription.status === "FREE_TRIAL" || subscription.status === "free_trial")) {
        // User is on free trial - subscription starts the day after trial ends
        const trialEndDate = new Date(subscription.endDate)
        trialEndDate.setHours(0, 0, 0, 0)
        trialEndDate.setMinutes(0, 0)
        trialEndDate.setSeconds(0, 0)
        trialEndDate.setMilliseconds(0)
        
        startDate = new Date(trialEndDate)
        startDate.setDate(startDate.getDate() + 1) // Start the day after trial ends
      } else if (subscription && new Date(subscription.endDate) > today) {
        // User has active subscription - start after current subscription ends
        const currentEndDate = new Date(subscription.endDate)
        currentEndDate.setHours(0, 0, 0, 0)
        currentEndDate.setMinutes(0, 0)
        currentEndDate.setSeconds(0, 0)
        currentEndDate.setMilliseconds(0)
        
        startDate = new Date(currentEndDate)
        startDate.setDate(startDate.getDate() + 1) // Start the day after current subscription ends
      } else {
        // No active subscription - start immediately
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        startDate.setMinutes(0, 0)
        startDate.setSeconds(0, 0)
        startDate.setMilliseconds(0)
      }
      
      // Calculate end date based on plan duration
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + planDetails.months)
      endDate.setHours(23, 59, 59, 999) // End of day

      const paymentId = `payment_${Date.now()}_${user.id}`
      const pendingSubscription = {
        id: subscription?.id || `sub_${Date.now()}`,
        userId: user.id,
        plan: selectedPlan,
        status: "pending" as const,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        createdAt: subscription?.createdAt || startDate.toISOString(),
        paymentStatus: "pending" as const,
        paymentId,
        isFreeTrial: false,
      }

      // Save old subscription to history before creating new one
      const existingSubData = localStorage.getItem(`subscription_${user.id}`)
      if (existingSubData && typeof window !== "undefined") {
        try {
          const existingSub = JSON.parse(existingSubData)
          // Only save to history if it's not already a pending subscription
          if (existingSub.status !== "pending" && existingSub.status !== "PENDING") {
            const subscriptionHistory = JSON.parse(localStorage.getItem(`subscription_history_${user.id}`) || "[]")
            subscriptionHistory.push({
              ...existingSub,
              id: existingSub.id || `sub_${Date.now()}_old`,
              endedAt: new Date().toISOString(),
            })
            const recentHistory = subscriptionHistory.slice(-20)
            localStorage.setItem(`subscription_history_${user.id}`, JSON.stringify(recentHistory))
          }
        } catch (error) {
          console.error("Error saving subscription history:", error)
        }
      }

      // Save pending subscription
      localStorage.setItem(`subscription_${user.id}`, JSON.stringify(pendingSubscription))

      // Update subscription in auth context
      updateSubscription(pendingSubscription)

      // Save payment request for admin approval via API
      try {
        console.log("[Billing] Creating payment request via API...")
        console.log("[Billing] Request payload:", {
          userId: user.id,
          plan: selectedPlan,
          planName: planDetails.name,
          price: planDetails.price,
          months: planDetails.months,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        
        const paymentResponse = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            plan: selectedPlan,
            planName: planDetails.name,
            price: planDetails.price,
            months: planDetails.months,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        })

        console.log("[Billing] Payment API response status:", paymentResponse.status, paymentResponse.statusText)

        if (!paymentResponse.ok) {
          let errorData: any = {}
          try {
            const responseText = await paymentResponse.text()
            console.error("[Billing] ❌ API error response text:", responseText)
            try {
              errorData = JSON.parse(responseText)
            } catch (parseError) {
              errorData = { error: responseText || `HTTP ${paymentResponse.status}` }
            }
          } catch (e) {
            errorData = { error: `HTTP ${paymentResponse.status} ${paymentResponse.statusText}` }
          }
          
          console.error("[Billing] ❌ Failed to create payment request via API:", {
            status: paymentResponse.status,
            statusText: paymentResponse.statusText,
            error: errorData,
          })
          
          // Show detailed error message
          let errorMessage = errorData.error || errorData.details || `Failed to create payment request (${paymentResponse.status})`
          if (errorData.missingFields && errorData.missingFields.length > 0) {
            errorMessage += `. Missing fields: ${errorData.missingFields.join(", ")}`
          }
          if (errorData.code) {
            errorMessage += ` [Error Code: ${errorData.code}]`
          }
          
          throw new Error(errorMessage)
        }

        const paymentData = await paymentResponse.json()
        console.log("[Billing] ✅ Payment request created successfully:", paymentData.payment?.id)
        
        // Receipt email and admin notification email are sent automatically by the API
        console.log("[Billing] ✅ Emails should have been sent automatically")
      } catch (apiError: any) {
        console.error("[Billing] ❌ Error creating payment request via API:", {
          message: apiError?.message,
          name: apiError?.name,
          error: apiError,
          stack: apiError?.stack,
        })
        
        // Show user-friendly error message with all available details
        let errorMessage = "Failed to submit payment"
        if (apiError?.message) {
          errorMessage = apiError.message
        } else if (apiError?.error) {
          errorMessage = apiError.error
        } else if (typeof apiError === "string") {
          errorMessage = apiError
        }
        
        // Add network error detection
        if (apiError?.name === "TypeError" && apiError?.message?.includes("fetch")) {
          errorMessage = "Network error: Could not connect to server. Please check your internet connection and try again."
        }
        
        console.error("[Billing] Showing error to user:", errorMessage)
        toast.error(errorMessage, {
          duration: 5000, // Show for 5 seconds
        })
        setLoading(false)
        return // Don't continue if API call fails
      }

      toast.success("Payment submitted! Your admin panel will be activated within 15 minutes after admin approval.")

      // Small delay before redirect to show toast
      setTimeout(() => {
        router.push("/billing/success")
      }, 500)
    } catch (error: any) {
      console.error("[Billing] ❌ Outer catch - Payment error:", {
        message: error?.message,
        name: error?.name,
        error: error,
        stack: error?.stack,
      })
      
      // Only show generic error if we don't have a specific one
      if (!error?.message || error.message === "Failed to submit payment") {
        toast.error("Failed to process payment. Please check the console for details and try again.")
      } else {
        // This shouldn't happen if inner catch is working, but just in case
        toast.error(error.message || "Failed to process payment. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const plans = [
    { id: "SIX_MONTH" as SubscriptionPlan, ...PLAN_PRICING.SIX_MONTH },
    { id: "TWELVE_MONTH" as SubscriptionPlan, ...PLAN_PRICING.TWELVE_MONTH },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Billing & Payment</h1>
          <p className="text-gray-300">Select your subscription plan and complete payment</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Plan Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50">
                <CardTitle className="text-xl text-white">Select Subscription Plan</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all border-2 ${
                        selectedPlan === plan.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{plan.name}</h3>
                          {selectedPlan === plan.id && (
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <p className="text-2xl font-bold text-white mb-1">€{plan.price}</p>
                        <p className="text-sm text-gray-400">{t("subscription.for")} {plan.months === 6 ? t("subscription.sixMonths") : plan.months === 12 ? t("subscription.twelveMonths") : `${plan.months} ${t("subscription.months")}`}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Info */}
            <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg">
                  <Smartphone className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="text-white font-semibold">MBWay Payment</p>
                    <p className="text-sm text-gray-400">Click "Complete Payment" to see payment details</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50">
                <CardTitle className="text-xl text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {selectedPlan ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Plan:</span>
                        <span className="text-white font-semibold">{PLAN_PRICING[selectedPlan].name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white">{PLAN_PRICING[selectedPlan].months === 6 ? t("subscription.sixMonths") : PLAN_PRICING[selectedPlan].months === 12 ? t("subscription.twelveMonths") : `${PLAN_PRICING[selectedPlan].months} ${t("subscription.months")}`}</span>
                      </div>
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-white">Total:</span>
                          <span className="text-2xl font-bold text-white">€{PLAN_PRICING[selectedPlan].price}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handlePayment}
                      disabled={loading || !selectedPlan}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <span className="mr-2">Processing...</span>
                          <svg className="animate-spin h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </>
                      ) : (
                        "Complete Payment"
                      )}
                    </Button>
                    <p className="text-xs text-center text-gray-400">
                      Your admin panel will be activated within 15 minutes after admin approval
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400 text-center">Select a plan to continue</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MBWay Payment Modal */}
      <Dialog open={showMbwayModal} onOpenChange={setShowMbwayModal}>
        <DialogContent className="bg-white border-blue-200 text-black max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-green-600" />
              MBWay Payment
            </DialogTitle>
            <DialogDescription className="text-black">
              Please send the payment via MBWay using the details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
              <p className="text-sm text-black mb-2">MBWay Number</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-black">+351920306889</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("+351920306889")}
                  className="text-green-600 hover:text-green-700"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-300 rounded-lg">
              <p className="text-sm text-black mb-2">Recipient Name</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-black">Sheetal Sheetal</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("Sheetal Sheetal")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {selectedPlan && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-black mb-1">Amount to Pay</p>
                <p className="text-2xl font-bold text-white">€{PLAN_PRICING[selectedPlan].price}</p>
                <p className="text-xs text-gray-500 mt-1">{PLAN_PRICING[selectedPlan].name}</p>
              </div>
            )}

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-300">
                ⚠️ After sending the payment, click "Confirm Payment" below. Your subscription will be activated after admin approval.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowMbwayModal(false)}
              className="flex-1 border-gray-700 text-gray-300 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

