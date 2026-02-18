"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/components/language-provider"
import { PLAN_PRICING, type SubscriptionPlan } from "@/lib/constants"
import { isExpired, isExpiringSoon, getDaysUntilExpiration, isNotStarted, getSubscriptionEndDate } from "@/lib/subscription-utils"
import { toast } from "sonner"
import { Check, AlertCircle, Calendar, Mail, Clock, History } from "lucide-react"
import { scheduleSubscriptionChecks } from "@/lib/subscription-notifications"

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, subscription, updateSubscription, loading: authLoading } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Redirect to login if not authenticated (required for subscription flow)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/subscription")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Initialize subscription notification checks
    scheduleSubscriptionChecks()
    
    // Load subscription history from API
    if (user?.id) {
      loadSubscriptionHistory()
    }
  }, [user])

  const loadSubscriptionHistory = async () => {
    if (!user?.id) return
    
    setLoadingHistory(true)
    try {
      // Try to load from API first
      const response = await fetch(`/api/subscriptions/history?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setSubscriptionHistory(data.history || [])
      } else {
        // Fallback to localStorage
        const history = JSON.parse(localStorage.getItem(`subscription_history_${user.id}`) || "[]")
        setSubscriptionHistory(history)
      }
    } catch (error) {
      console.error("Error loading subscription history:", error)
      // Fallback to localStorage
      const history = JSON.parse(localStorage.getItem(`subscription_history_${user.id}`) || "[]")
      setSubscriptionHistory(history)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Auto-refresh subscription status and save expired subscriptions to history
  useEffect(() => {
    if (!user?.id) return

    const refreshSubscription = async () => {
      try {
        const response = await fetch(`/api/subscriptions?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.subscription) {
            const currentSub = data.subscription
            
            // Check if subscription is expired and save to history if not already saved
            if (isExpired(currentSub) && !isNotStarted(currentSub)) {
              // Check if already in history
              const historyResponse = await fetch(`/api/subscriptions/history?userId=${user.id}`)
              if (historyResponse.ok) {
                const historyData = await historyResponse.json()
                const history = historyData.history || []
                const alreadyInHistory = history.some((h: any) => h.id === currentSub.id)
                
                // If not in history, save it
                if (!alreadyInHistory) {
                  try {
                    await fetch("/api/subscriptions/history", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        userId: currentSub.userId,
                        subscriptionId: currentSub.id,
                        plan: currentSub.plan,
                        status: "EXPIRED",
                        startDate: currentSub.startDate,
                        endDate: currentSub.endDate,
                        price: currentSub.price,
                        paymentStatus: currentSub.paymentStatus,
                        paymentId: currentSub.paymentId,
                        isFreeTrial: currentSub.isFreeTrial,
                      }),
                    })
                  } catch (error) {
                    console.error("Error saving expired subscription to history:", error)
                  }
                }
              }
            }
            
            // Update subscription in sessionStorage and trigger update
            sessionStorage.setItem("subscription", JSON.stringify(currentSub))
            updateSubscription(currentSub)
            
            // Reload history
            await loadSubscriptionHistory()
          }
        }
      } catch (error) {
        console.error("Error refreshing subscription:", error)
      }
    }

    // Refresh immediately
    refreshSubscription()
    
    // Then refresh every 30 seconds (reduced frequency for better performance)
    const interval = setInterval(refreshSubscription, 30000)
    
    return () => clearInterval(interval)
  }, [user?.id, updateSubscription])

  // Allow access to subscription page even if subscription is expired
  // This page is accessible to allow users to renew

  const plans = [
    {
      id: "SIX_MONTH" as SubscriptionPlan,
      name: PLAN_PRICING.SIX_MONTH.name,
      price: 100,
      period: t("subscription.sixMonths"),
      popular: true,
    },
    {
      id: "TWELVE_MONTH" as SubscriptionPlan,
      name: PLAN_PRICING.TWELVE_MONTH.name,
      price: 150,
      period: t("subscription.twelveMonths"),
      popular: false,
    },
  ]

  const handleRenew = async (plan: SubscriptionPlan) => {
    // Redirect to billing page for payment
    router.push("/billing")
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: "none", message: t("subscription.noActive"), color: "gray" }
    
    // If subscription is ACTIVE and payment is APPROVED, show as active (don't check start date)
    const isActive = subscription.status === "ACTIVE" || subscription.status === "active"
    const isPaymentApproved = subscription.paymentStatus === "APPROVED" || subscription.paymentStatus === "approved"
    if (isActive && isPaymentApproved) {
      return { status: "active", message: t("subscription.active"), color: "green" }
    }
    
    if (subscription.status === "free_trial" || subscription.isFreeTrial || subscription.status === "FREE_TRIAL") {
      const days = getDaysUntilExpiration(subscription)
      return { status: "free_trial", message: t("subscription.freePlanDaysLeft").replace("{days}", days.toString()), color: "blue" }
    }
    if (subscription.status === "pending" || subscription.status === "PENDING") {
      return { status: "pending", message: t("subscription.paymentPending"), color: "yellow" }
    }
    // Check if subscription hasn't started yet (but only if not ACTIVE)
    if (!isActive && isNotStarted(subscription)) {
      return { status: "not_started", message: t("subscription.notStarted"), color: "gray" }
    }
    // Check if expired (only if end date has passed)
    if (isExpired(subscription)) {
      return { status: "expired", message: t("subscription.expiredStatus"), color: "red" }
    }
    if (isExpiringSoon(subscription, 7)) {
      const days = getDaysUntilExpiration(subscription)
      return { status: "expiring", message: t("subscription.expiresIn").replace("{days}", days.toString()), color: "yellow" }
    }
    return { status: "active", message: t("subscription.active"), color: "green" }
  }

  const statusInfo = getSubscriptionStatus()
  const daysUntilExpiration = subscription ? getDaysUntilExpiration(subscription) : 0

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 text-black dark:text-white p-6">
          <div className="p-4 bg-blue-50 dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg">
            <h2 className="text-xl font-bold text-black dark:text-white mb-2">{t("subscription.loading")}</h2>
            <p className="text-gray-600 dark:text-gray-300">{t("subscription.loadingMessage")}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <DashboardLayout>
        <div className="space-y-6 text-black dark:text-white p-6">
          <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <CardHeader className="bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
              <CardTitle className="text-xl text-black dark:text-white">{t("subscription.loginRequired")}</CardTitle>
              <CardDescription className="text-black dark:text-gray-300">
                {t("subscription.loginRequiredMessage")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Button
                onClick={() => router.push("/login?redirect=/subscription")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {t("subscription.goToLogin")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black dark:text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-black dark:text-white">
              {t("subscription.title")}
            </h1>
            <p className="text-black dark:text-gray-300 text-balance">
              {t("subscription.subtitle")}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowHistory(!showHistory)
              if (!showHistory) {
                loadSubscriptionHistory()
              }
            }}
            className="flex items-center gap-2 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700"
          >
            <History className="w-4 h-4" />
            {showHistory ? t("subscription.hideHistory") : t("subscription.viewHistory")}
          </Button>
        </div>

        {/* Free Trial Status */}
        {subscription && (subscription.status === "free_trial" || subscription.status === "FREE_TRIAL" || subscription.isFreeTrial) && !isExpired(subscription) && (
          <Card className="shadow-2xl border-2 border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {t("subscription.freePlan")} - {getDaysUntilExpiration(subscription) >= 0 ? `${getDaysUntilExpiration(subscription)} ${t("subscription.days")}` : `${Math.abs(getDaysUntilExpiration(subscription))} ${t("subscription.days")}`}
                  </h3>
                  <p className="text-black dark:text-gray-300 mb-2">
                    {t("subscription.freeTrialMessage")} {getSubscriptionEndDate(subscription).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}.
                  </p>
                  <p className="text-sm text-black dark:text-gray-300">
                    {t("subscription.afterTrial")}
                  </p>
                  {/* Show selected plan if available */}
                  {subscription.plan && (subscription.plan === "SIX_MONTH" || subscription.plan === "TWELVE_MONTH") && (
                    <p className="text-sm text-blue-600 mt-2 font-semibold">
                      {t("subscription.selectedPlan")}: {subscription.plan === "SIX_MONTH" ? t("plan.sixMonthsName") : t("plan.twelveMonthsName")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Payment Status */}
        {subscription && subscription.status === "pending" && (
          <Card className="shadow-2xl border-2 border-yellow-300 dark:border-yellow-600 bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{t("subscription.paymentPending")}</h3>
                  <p className="text-black dark:text-gray-300 mb-2">
                    {t("subscription.paymentPendingMessage")}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {t("subscription.paymentPendingInfo")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Not Started Subscription */}
        {subscription && isNotStarted(subscription) && (
          <Card className="shadow-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-600 dark:text-gray-300 mb-2">{t("subscription.notStarted")}</h3>
                  <p className="text-black dark:text-gray-300 mb-2">
                    {t("subscription.notStartedMessage")} <strong>{new Date(subscription.startDate).toLocaleDateString()}</strong>.
                  </p>
                  <p className="text-sm text-black dark:text-gray-300">
                    {t("subscription.notStartedInfo")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expired Subscription Warning */}
        {subscription && isExpired(subscription) && !isNotStarted(subscription) && (
          <Card className="shadow-2xl border-2 border-red-300 dark:border-red-600 bg-white dark:bg-gray-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                    {subscription.isFreeTrial || subscription.status === "FREE_TRIAL" || subscription.status === "free_trial"
                      ? "Subscription Expired"
                      : "Subscription Expired"}
                  </h3>
                  <p className="text-black dark:text-gray-300 mb-4">
                    {subscription.isFreeTrial || subscription.status === "FREE_TRIAL" || subscription.status === "free_trial"
                      ? `Your free trial ended on ${getSubscriptionEndDate(subscription).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}. Subscribe from below then you can use your panel.`
                      : `Your subscription ended on ${getSubscriptionEndDate(subscription).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}. Please subscribe to continue using the admin panel.`}
                  </p>
                  <p className="text-sm text-black dark:text-gray-300 mb-4">
                    {subscription.isFreeTrial || subscription.status === "FREE_TRIAL" || subscription.status === "free_trial"
                      ? "Select a subscription plan below to continue accessing all features."
                      : "Select a subscription plan below to continue accessing all features."}
                  </p>
                  <Button
                    onClick={() => {
                      // Scroll to plans section
                      const plansSection = document.getElementById("subscription-plans")
                      if (plansSection) {
                        plansSection.scrollIntoView({ behavior: "smooth" })
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {t("subscription.choosePlan") || "Choose Your Plan"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription Status */}
        {subscription && (
          <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <CardHeader className="bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-black dark:text-white">{t("subscription.current")}</CardTitle>
                  <CardDescription className="text-black dark:text-gray-300">
                    {(() => {
                      const planKey = subscription.plan === "MONTHLY" ? "monthly" :
                                    subscription.plan === "THREE_MONTH" ? "starter" :
                                    subscription.plan === "SIX_MONTH" ? "professional" :
                                    subscription.plan === "TWELVE_MONTH" ? "enterprise" : "";
                      return planKey ? t(`plan.${planKey}`) : (PLAN_PRICING[subscription.plan]?.name || subscription.plan);
                    })()}
                  </CardDescription>
                </div>
                <Badge 
                  className={`${
                    statusInfo.status === "active" ? "bg-green-100 text-green-700 border-green-300" :
                    statusInfo.status === "pending" || statusInfo.status === "expiring" ? "bg-yellow-100 text-yellow-700 border-yellow-300" :
                    statusInfo.status === "expired" ? "bg-red-100 text-red-700 border-red-300" :
                    statusInfo.status === "not_started" ? "bg-gray-100 text-gray-700 border-gray-300" :
                    statusInfo.status === "free_trial" ? "bg-blue-100 text-blue-700 border-blue-300" :
                    "bg-gray-100 text-gray-700 border-gray-300"
                  }`}
                >
                  {statusInfo.message}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-black dark:text-gray-300">{t("subscription.startDate")}</p>
                  <p className="text-sm text-black dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(subscription.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-black dark:text-gray-300">{t("subscription.endDate")}</p>
                  <p className="text-sm text-black dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {getSubscriptionEndDate(subscription).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-black dark:text-gray-300">{t("subscription.plan")}</p>
                  <p className="text-sm text-black dark:text-white">
                    {(() => {
                      const planKey = subscription.plan === "MONTHLY" ? "monthly" :
                                    subscription.plan === "THREE_MONTH" ? "starter" :
                                    subscription.plan === "SIX_MONTH" ? "professional" :
                                    subscription.plan === "TWELVE_MONTH" ? "enterprise" : "";
                      return planKey ? t(`plan.${planKey}`) : (PLAN_PRICING[subscription.plan]?.name || subscription.plan);
                    })()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-black dark:text-gray-300">{t("subscription.price")}</p>
                  <p className="text-sm text-black dark:text-white font-semibold">€{PLAN_PRICING[subscription.plan]?.price || 0}</p>
                </div>
              </div>

              {isExpiringSoon(subscription, 7) && !isExpired(subscription) && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                        {subscription.isFreeTrial || subscription.status === "FREE_TRIAL" || subscription.status === "free_trial"
                          ? "Free Trial Expiring Soon"
                          : "Subscription Expiring Soon"}
                      </p>
                      <p className="text-xs text-black dark:text-gray-300">
                        {subscription.isFreeTrial || subscription.status === "FREE_TRIAL" || subscription.status === "free_trial"
                          ? `Your free trial will end on ${getSubscriptionEndDate(subscription).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}. Subscribe now to continue using your admin panel.`
                          : `Your subscription will expire on ${getSubscriptionEndDate(subscription).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}. Renew now to continue accessing all features.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isNotStarted(subscription) && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        {t("subscription.notStarted")}
                      </p>
                      <p className="text-xs text-black dark:text-gray-300">
                        {t("subscription.notStartedMessage")} {new Date(subscription.startDate).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isExpired(subscription) && !isNotStarted(subscription) && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">
                        {t("subscription.expired")}
                      </p>
                      <p className="text-xs text-black dark:text-gray-300">
                        {t("subscription.expiredMessage")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                onClick={() => handleRenew(subscription.plan)}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? t("subscription.processing") : t("subscription.renewSamePlan")}
              </Button>
            </CardFooter>
          </Card>
        )}

        {!subscription && (
          <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <CardHeader className="bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
              <CardTitle className="text-xl text-black dark:text-white">{t("subscription.noActive")}</CardTitle>
              <CardDescription className="text-black dark:text-gray-300">
                {t("subscription.noActiveMessage")}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Available Plans */}
        <div id="subscription-plans">
          <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">
            {subscription ? t("subscription.upgradeOrChange") : t("subscription.choosePlan")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all duration-300 hover:shadow-2xl ${
                  plan.popular
                    ? "border-blue-500 dark:border-blue-600 shadow-xl scale-105 bg-white dark:bg-gray-900"
                    : "border-blue-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-1 text-xs font-semibold text-white shadow-md">
                      {t("plan.mostPopular")}
                    </div>
                  </div>
                )}
                <CardHeader className="pb-4 bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
                  <CardTitle className="text-xl text-black dark:text-white">
                    {plan.id === "SIX_MONTH" ? t("plan.sixMonthsName") : plan.id === "TWELVE_MONTH" ? t("plan.twelveMonthsName") : plan.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    {plan.id === "SIX_MONTH" ? t("subscription.sixMonths") : plan.id === "TWELVE_MONTH" ? t("subscription.twelveMonths") : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-4xl font-bold text-black dark:text-white">€{plan.price}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {plan.id === "SIX_MONTH" ? t("plan.sixMonthsDescription") : plan.id === "TWELVE_MONTH" ? t("plan.twelveMonthsDescription") : PLAN_PRICING[plan.id]?.description || ""}
                  </p>
                  <ul className="space-y-2">
                    {PLAN_PRICING[plan.id]?.features.map((feature) => {
                      // Map feature text to translation key
                      const featureKey = feature === "Repair device management" ? "feature.repairTicketManagement" :
                                        feature === "Customer database" ? "feature.customerDatabase" :
                                        feature === "Payment processing" ? "feature.paymentProcessing" :
                                        feature === "Analytics & reports" ? "feature.analyticsReports" :
                                        feature === "Email support" ? "feature.emailSupport" : null
                      return (
                        <li key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-orange-500 dark:text-orange-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-black dark:text-gray-300">{featureKey ? t(featureKey) : feature}</span>
                        </li>
                      )
                    })}
                  </ul>
                </CardContent>
                <CardFooter>
                  {subscription && subscription.plan === plan.id ? (
                    <Button
                      onClick={() => handleRenew(plan.id)}
                      disabled={loading}
                      className={`w-full ${
                        plan.popular 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white"
                      }`}
                    >
                      {loading ? t("subscription.processing") : t("subscription.renewPlan")}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        // Ensure user is logged in before proceeding
                        if (!user) {
                          router.push(`/login?redirect=/billing?plan=${plan.id}`)
                        } else {
                          router.push(`/billing?plan=${plan.id}`)
                        }
                      }}
                      className={`w-full ${
                        plan.popular 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                          : "bg-gray-700 hover:bg-gray-600 border border-gray-600 text-white"
                      }`}
                      disabled={!user}
                    >
                      {!user ? t("subscription.loginRequired") || "Login Required" : t("subscription.subscribe")}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription History */}
        {showHistory && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">{t("subscription.history")}</h2>
            <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <CardContent className="p-6">
                {loadingHistory ? (
                  <p className="text-black dark:text-gray-300 text-center py-8">Loading history...</p>
                ) : subscriptionHistory.length === 0 ? (
                  <p className="text-black dark:text-gray-300 text-center py-8">{t("subscription.noHistory")}</p>
                ) : (
                  <div className="space-y-4">
                    {subscriptionHistory.map((historyItem: any, index: number) => (
                    <div
                      key={`${historyItem.id}_${index}`}
                      className="p-4 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-black dark:text-white font-semibold">
                            {(() => {
                              const planKey = historyItem.plan === "MONTHLY" ? "monthly" :
                                            historyItem.plan === "THREE_MONTH" ? "starter" :
                                            historyItem.plan === "SIX_MONTH" ? "professional" :
                                            historyItem.plan === "TWELVE_MONTH" ? "enterprise" : "";
                              return planKey ? t(`plan.${planKey}`) : (PLAN_PRICING[historyItem.plan as SubscriptionPlan]?.name || historyItem.plan);
                            })()}
                          </p>
                          <p className="text-xs text-black dark:text-gray-300">
                            {new Date(historyItem.createdAt || historyItem.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={
                            historyItem.status === "ACTIVE" || historyItem.status === "active"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                              : historyItem.status === "pending" || historyItem.status === "PENDING"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700"
                              : historyItem.paymentStatus === "REJECTED" || historyItem.paymentStatus === "rejected"
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700"
                              : historyItem.isFreeTrial || historyItem.status === "FREE_TRIAL" || historyItem.status === "free_trial"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                          }
                        >
                          {historyItem.isFreeTrial || historyItem.status === "FREE_TRIAL" || historyItem.status === "free_trial"
                            ? "Free Trial"
                            : historyItem.paymentStatus === "REJECTED" || historyItem.paymentStatus === "rejected"
                            ? t("subscription.paymentDeclined")
                            : historyItem.paymentStatus === "APPROVED" || historyItem.paymentStatus === "approved"
                            ? t("subscription.paymentApproved")
                            : historyItem.status === "pending" || historyItem.status === "PENDING"
                            ? t("subscription.pending")
                            : historyItem.status === "expired" || historyItem.status === "EXPIRED"
                            ? t("subscription.expiredStatus")
                            : historyItem.status || "Unknown"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-black dark:text-gray-300 text-xs">{t("subscription.startDate")}</p>
                          <p className="text-black dark:text-white">
                            {new Date(historyItem.startDate).toLocaleDateString()}
                            {isNotStarted(historyItem) && (
                              <span className="ml-2 text-xs text-black dark:text-gray-300">{t("subscription.scheduled")}</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-black dark:text-gray-300 text-xs">{t("subscription.endDate")}</p>
                          <p className="text-black dark:text-white">
                            {getSubscriptionEndDate(historyItem).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-black dark:text-gray-300 text-xs">{t("subscription.price")}</p>
                          <p className="text-black dark:text-white font-semibold">
                            €{PLAN_PRICING[historyItem.plan as SubscriptionPlan]?.price || historyItem.price || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-black dark:text-gray-300 text-xs">{t("subscription.duration")}</p>
                          <p className="text-black dark:text-white">
                            {PLAN_PRICING[historyItem.plan as SubscriptionPlan]?.months || 0} {t("subscription.months")}
                          </p>
                        </div>
                      </div>
                      {isNotStarted(historyItem) && (
                        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded text-xs text-blue-700 dark:text-blue-400">
                          {t("subscription.scheduledMessage").replace("{date}", new Date(historyItem.startDate).toLocaleDateString())}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Email Notification Info */}
        <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardHeader className="bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700">
            <CardTitle className="text-lg text-black dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {t("subscription.emailNotifications")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-black dark:text-gray-300">
              {t("subscription.emailNotificationMessage").replace("{email}", user?.email || "")}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

