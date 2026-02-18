"use client"

import { useState, useEffect, Suspense } from "react"
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

function BillingContent() {
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

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error("Please select a subscription plan")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create checkout session")
      }

      const data = await response.json()
      
      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        throw new Error("No checkout URL received")
      }
    } catch (error: any) {
      console.error("[Billing] Payment error:", error)
      toast.error(error.message || "Failed to initiate payment")
      setLoading(false)
    }
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

      // Calculate start date: Always start from TODAY when purchasing
      // If subscription is expired (free trial ended), start from today
      // If subscription is active, start from today (renewal)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      today.setMinutes(0, 0)
      today.setSeconds(0, 0)
      today.setMilliseconds(0)
      
      // Always start from today when user purchases a subscription
      const startDate = new Date(today)
      
      // Calculate end date based on plan duration from today
      // SIX_MONTH (€100) = 6 months from today
      // TWELVE_MONTH (€150) = 12 months (1 year) from today
      const endDate = new Date(today)
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
      <div className="space-y-6 text-black dark:text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Upgrade or Change Plan</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Plan Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all border-2 ${
                    selectedPlan === plan.id
                      ? "border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-gray-800"
                      : "border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.id === "SIX_MONTH" && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-black dark:text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{plan.months === 6 ? "6 months" : "12 months"}</p>
                    <p className="text-3xl font-bold text-black dark:text-white mb-2">€{plan.price}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{PLAN_PRICING[plan.id]?.description || ""}</p>
                    
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-orange-500 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPlan(plan.id)
                        setTimeout(() => {
                          handlePayment()
                        }, 100)
                      }}
                      className="w-full bg-blue-400 hover:bg-blue-500 text-white"
                    >
                      Subscribe
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Payment Method Info */}
            <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-gray-800 dark:to-gray-800 border-b border-blue-200 dark:border-gray-700 rounded-t-lg">
                <CardTitle className="text-xl text-black dark:text-white flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <Smartphone className="w-8 h-8 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-black dark:text-white font-semibold">MBWay Payment</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click "Complete Payment" to see payment details</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-gray-800 dark:to-gray-800 border-b border-blue-200 dark:border-gray-700 rounded-t-lg">
                <CardTitle className="text-xl text-black dark:text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {selectedPlan ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Plan:</span>
                        <span className="text-black dark:text-white font-semibold">{PLAN_PRICING[selectedPlan].name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="text-black dark:text-white">{PLAN_PRICING[selectedPlan].months === 6 ? "6 months" : PLAN_PRICING[selectedPlan].months === 12 ? "12 months" : `${PLAN_PRICING[selectedPlan].months} months`}</span>
                      </div>
                      <div className="border-t border-gray-300 dark:border-gray-700 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-lg font-semibold text-black dark:text-white">Total:</span>
                          <span className="text-2xl font-bold text-black dark:text-white">€{PLAN_PRICING[selectedPlan].price}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={handlePayment}
                      disabled={loading || !selectedPlan}
                      className="w-full bg-blue-400 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                      You will be redirected to Stripe to complete your secure payment
                    </p>
                  </>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center">Select a plan to continue</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MBWay Payment Modal */}
      <Dialog open={showMbwayModal} onOpenChange={setShowMbwayModal}>
        <DialogContent className="bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-700 text-black dark:text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
              MBWay Payment
            </DialogTitle>
            <DialogDescription className="text-black dark:text-gray-300">
              Please send the payment via MBWay using the details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg">
              <p className="text-sm text-black dark:text-gray-300 mb-2">MBWay Number</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-black dark:text-white">+351920306889</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("+351920306889")}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-black dark:text-gray-300 mb-2">Recipient Name</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-black dark:text-white">Sheetal Sheetal</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard("Sheetal Sheetal")}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {selectedPlan && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-black dark:text-gray-300 mb-1">Amount to Pay</p>
                <p className="text-2xl font-bold text-black dark:text-white">€{PLAN_PRICING[selectedPlan].price}</p>
                <p className="text-xs text-black dark:text-gray-300 mt-1">{PLAN_PRICING[selectedPlan].name}</p>
              </div>
            )}

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                ⚠️ After sending the payment, click "Confirm Payment" below. Your subscription will be activated after admin approval.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowMbwayModal(false)}
              className="flex-1 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={loading}
              className="flex-1 bg-blue-400 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
            >
              {loading ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="space-y-6 text-black p-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-bold text-black mb-2">Loading Billing Page...</h2>
            <p className="text-gray-600">Please wait while we load your billing information.</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <BillingContent />
    </Suspense>
  )
}

