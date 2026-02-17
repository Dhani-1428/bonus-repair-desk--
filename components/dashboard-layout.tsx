"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { scheduleSubscriptionChecks } from "@/lib/subscription-notifications"
import { AlertCircle, CheckCircle, Clock, X } from "lucide-react"
import { CardReaderIntegration } from "@/components/card-reader-integration"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, logout, loading, subscription, updateSubscription } = useAuth()
  const { language, setLanguage, t } = useTranslation()
  const [showPaymentBanner, setShowPaymentBanner] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Check if payment notification has been dismissed
  useEffect(() => {
    if (!user?.id || !subscription) return
    
    // Create unique key for this payment notification
    const notificationKey = `payment_notification_dismissed_${user.id}_${subscription.id}_${subscription.paymentStatus}`
    
    // Check if this specific notification was dismissed
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(notificationKey)
      if (dismissed) {
        setShowPaymentBanner(false)
      } else {
        setShowPaymentBanner(true)
      }
    }
  }, [user?.id, subscription?.id, subscription?.paymentStatus])

  // Function to dismiss payment notification permanently
  const dismissPaymentNotification = () => {
    if (!user?.id || !subscription) return
    
    const notificationKey = `payment_notification_dismissed_${user.id}_${subscription.id}_${subscription.paymentStatus}`
    
    // Mark as dismissed in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(notificationKey, new Date().toISOString())
      setShowPaymentBanner(false)
    }
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    // Check subscription status for non-super-admin users (only if not already on subscription or pricing page)
    // Skip subscription check for super admin (check role or email)
    const isSuperAdmin = 
      user?.role === "super_admin" || 
      (typeof user?.role === "string" && user.role.toUpperCase() === "SUPER_ADMIN") || 
      user?.email === "superadmin@admin.com" ||
      user?.email?.toLowerCase() === "superadmin@admin.com"
    
    // Redirect super admin to super admin panel
    if (user && isSuperAdmin && typeof window !== "undefined") {
      const currentPath = window.location.pathname
      // Only redirect if not already on super admin pages
      if (!currentPath.startsWith("/super-admin")) {
        router.replace("/super-admin")
        return
      }
    }
    
    if (user && !isSuperAdmin && typeof window !== "undefined") {
      const currentPath = window.location.pathname
      // Don't redirect if already on subscription, pricing, billing, or login page
      if (currentPath === "/subscription" || currentPath === "/pricing" || currentPath === "/billing" || currentPath.startsWith("/billing/") || currentPath === "/login" || currentPath === "/register") {
        return
      }

      // Check subscription from API
      const checkSubscription = async () => {
        try {
          const response = await fetch(`/api/subscriptions?userId=${user.id}`)
          if (!response.ok) {
            // If API fails, allow access (don't block users)
            return
          }
          
          const data = await response.json()
          const subscription = data.subscription
          
          if (!subscription) {
            // No subscription found, redirect to subscription page
            router.push("/subscription")
            return
          }

          const endDate = new Date(subscription.endDate)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          today.setMinutes(0, 0, 0)
          today.setSeconds(0, 0)
          today.setMilliseconds(0)
          
          const endDateNormalized = new Date(endDate)
          endDateNormalized.setHours(0, 0, 0, 0)
          endDateNormalized.setMinutes(0, 0, 0)
          endDateNormalized.setSeconds(0, 0)
          endDateNormalized.setMilliseconds(0)
          
          const isExpired = endDateNormalized < today
          const isFreeTrial = subscription.status === "FREE_TRIAL" || subscription.status === "free_trial" || subscription.isFreeTrial
          const paymentStatus = subscription.paymentStatus || "PENDING"
          const isPaymentApproved = paymentStatus === "APPROVED" || paymentStatus === "approved"
          const subscriptionStatus = subscription.status || "PENDING"
          const isActive = subscriptionStatus === "ACTIVE" || subscriptionStatus === "active"
          
          // If subscription is ACTIVE and payment is APPROVED, allow full access immediately
          if (isActive && isPaymentApproved) {
            // Subscription is active - allow access to all pages
            return
          }
          
          // Block access if subscription is expired - redirect to subscription page only
          if (isExpired) {
            router.push("/subscription")
            return
          }
          
          // Block access if payment is not approved AND subscription is not active (unless it's a free trial)
          // After superadmin approves payment, subscription becomes ACTIVE and user gets full access
          if (!isFreeTrial && !isPaymentApproved && !isActive) {
            router.push("/subscription")
            return
          }
        } catch (error) {
          console.error("[DashboardLayout] Error checking subscription:", error)
          // On error, don't block access - allow user to continue
        }
      }
      
      checkSubscription()
    }
  }, [user, loading, router])

  // Calculate isSuperAdmin early so it can be used in useEffect
  const isSuperAdmin = user?.role === "super_admin" || (typeof user?.role === "string" && user.role.toUpperCase() === "SUPER_ADMIN") || user?.email === "superadmin@admin.com"

  useEffect(() => {
    // Initialize subscription notification checks when user is logged in
    if (user && !loading) {
      scheduleSubscriptionChecks()
      
      // Reload subscription to get latest payment status
      const loadSubscription = async () => {
        if (!user.id || isSuperAdmin) return
        try {
          const response = await fetch(`/api/subscriptions?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.subscription) {
              // Update subscription in sessionStorage and state
              sessionStorage.setItem("subscription", JSON.stringify(data.subscription))
              updateSubscription(data.subscription)
            }
          }
        } catch (error) {
          console.error("Error loading subscription:", error)
        }
      }
      
      loadSubscription()
      
      // Listen for subscription update events (when super admin approves/rejects)
      const handleSubscriptionUpdate = () => {
        loadSubscription()
      }
      
      window.addEventListener("subscriptionUpdated", handleSubscriptionUpdate)
      
      // Also poll every 30 seconds for updates (reduced frequency for better performance)
      const interval = setInterval(loadSubscription, 30000)
      
      return () => {
        window.removeEventListener("subscriptionUpdated", handleSubscriptionUpdate)
        clearInterval(interval)
      }
    }
  }, [user, loading, isSuperAdmin])

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-black dark:text-white">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const shopName = user.shopName || user.name || "Admin Panel"

  return (
    <>
      <CardReaderIntegration />
      <div className="min-h-screen w-full relative bg-blue-50 dark:bg-black">
      {/* Light Blue Background with Top Glow (Light Mode) / Dark Background (Dark Mode) */}
      <div
        className="absolute inset-0 z-0 dark:hidden"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(191, 219, 254, 0.3), transparent 60%), #f0f9ff",
        }}
      />
      <div
        className="absolute inset-0 z-0 hidden dark:block"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />
      
      {/* Header */}
      <header className="sticky top-2 z-[9999] mx-auto w-full flex-row items-center justify-between self-start rounded-full bg-white dark:bg-gradient-to-r dark:from-gray-900/90 dark:via-black/90 dark:to-gray-900/90 backdrop-blur-md border border-blue-200 dark:border-gray-800/50 shadow-lg dark:shadow-2xl transition-all duration-300 max-w-7xl px-2 sm:px-4 py-2 mt-2"
        style={{
          willChange: "transform",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          perspective: "1000px",
        }}
      >
        <div className="w-full flex items-center justify-between gap-2">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
              <span
                className={`block w-4 h-0.5 bg-blue-600 transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
              ></span>
              <span
                className={`block w-4 h-0.5 bg-blue-600 transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
              ></span>
              <span
                className={`block w-4 h-0.5 bg-blue-600 transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
              ></span>
            </div>
          </button>

          <Link href={isSuperAdmin ? "/super-admin" : "/dashboard"} className="z-50 flex items-center justify-center gap-2 sm:gap-3 transition-all duration-300 group flex-shrink-0">
            <img src="/BRD LOGO..png" alt="BRD Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-black dark:text-white font-bold text-sm sm:text-lg tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 truncate max-w-[120px] sm:max-w-none">
                {shopName}
              </span>
              {isSuperAdmin && (
                <span className="text-xs text-black dark:text-white font-medium hidden sm:block">Super Admin</span>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4 relative z-10">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            <div className="hidden sm:flex items-center gap-3">
              <label className="text-sm text-black dark:text-white flex items-center gap-2 font-medium">
                <svg className="w-4 h-4 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span className="hidden md:inline">{t("header.language")}:</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className="border border-blue-300 dark:border-zinc-700 rounded-lg text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 bg-white dark:bg-zinc-900 text-black dark:text-white hover:border-blue-400 dark:hover:border-zinc-600 focus:border-blue-500 dark:focus:border-zinc-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-zinc-700 transition-all font-medium"
                >
                  <option value="en">{t("header.english")}</option>
                  <option value="es">{t("header.spanish")}</option>
                  <option value="pt">{t("header.portuguese")}</option>
                  <option value="de">{t("header.german")}</option>
                  <option value="fr">{t("header.french")}</option>
                  <option value="it">Italiano</option>
                  <option value="nl">Nederlands</option>
                  <option value="pl">Polski</option>
                  <option value="ro">Română</option>
                  <option value="el">Ελληνικά</option>
                  <option value="cs">Čeština</option>
                  <option value="hu">Magyar</option>
                  <option value="sv">Svenska</option>
                  <option value="fi">Suomi</option>
                  <option value="da">Dansk</option>
                  <option value="bg">Български</option>
                  <option value="hr">Hrvatski</option>
                  <option value="sk">Slovenčina</option>
                  <option value="sl">Slovenščina</option>
                  <option value="lt">Lietuvių</option>
                  <option value="lv">Latviešu</option>
                  <option value="et">Eesti</option>
                  <option value="ga">Gaeilge</option>
                  <option value="mt">Malti</option>
                  <option value="ur">{t("header.urdu")}</option>
                  <option value="pa">{t("header.punjabi")}</option>
                  <option value="hi">{t("header.hindi")}</option>
                </select>
              </label>
            </div>
            <div className="h-8 w-px bg-blue-200 dark:bg-zinc-700 hidden sm:block"></div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-200 group-hover:ring-blue-400 transition-all duration-300">
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-black dark:text-white">{user?.name}</p>
                <p className="text-xs text-black dark:text-white capitalize font-medium">{user?.role || "member"}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={logout}
              className="border-blue-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 dark:hover:border-red-600 hover:text-red-600 dark:hover:text-red-400 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/20 transform hover:scale-105 text-xs sm:text-sm px-2 sm:px-3"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">{t("header.logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex relative z-10 mt-4">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-[9999] w-72 bg-blue-500 dark:bg-gradient-to-b dark:from-gray-900/90 dark:via-black/90 dark:to-gray-900/90 border-r border-blue-600 dark:border-gray-800/50 min-h-[calc(100vh-140px)] p-4 sm:p-6 shadow-lg dark:shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <nav className="space-y-2 animate-fade-in">
            {(user?.role === "super_admin" || (typeof user?.role === "string" && user.role.toUpperCase() === "SUPER_ADMIN") || user?.email === "superadmin@admin.com") ? (
              <>
                <div className="pt-2 mb-4">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                    <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                    Super Admin
                  </p>
                </div>
                <Link href="/super-admin">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <span className="relative">Dashboard</span>
                  </Button>
                </Link>
                <Link href="/super-admin/users">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="relative">Users Information</span>
                  </Button>
                </Link>
                <Link href="/super-admin/subscriptions">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <span className="relative">{t("header.subscriptions")}</span>
                  </Button>
                </Link>
                <Link href="/super-admin/payments">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="relative">Payment Approvals</span>
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                    <span className="relative">{t("header.dashboard")}</span>
                  </Button>
                </Link>
                <Link href="/tickets/new">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="relative">{t("header.newDevice")}</span>
                  </Button>
                </Link>
                <Link href="/tickets">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <span className="relative">{t("header.allDevices")}</span>
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                    <span className="relative">{t("header.analytics")}</span>
                  </Button>
                </Link>
                <Link href="/subscription">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <span className="relative">{t("header.subscription")}</span>
                  </Button>
                </Link>
                <div className="pt-4 mt-4 border-t border-blue-400">
                  <p className="text-xs font-semibold text-white uppercase tracking-wider px-3 mb-2 flex items-center gap-2">
                    <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                    {t("header.administration")}
                  </p>
                </div>
                <Link href="/settings">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="relative">Settings</span>
                  </Button>
                </Link>
                <Link href="/trash">
                  <Button variant="ghost" className="w-full justify-start hover:bg-blue-100 hover:text-black text-white font-medium h-12 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50 transition-all duration-300"></div>
                    <div className="relative w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-all duration-300 shadow-md group-hover:shadow-blue-300 group-hover:scale-110">
                      <svg className="w-5 h-5 text-white group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </div>
                    <span className="relative">{t("header.trash")}</span>
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Payment Status Banner */}
        {!isSuperAdmin && subscription && subscription.paymentStatus && showPaymentBanner && (
          <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-0">
            <div className="container mx-auto max-w-7xl">
              {(subscription.paymentStatus === "REJECTED" || (typeof subscription.paymentStatus === "string" && subscription.paymentStatus.toLowerCase() === "rejected")) ? (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-black font-semibold text-base sm:text-lg">{t("payment.declined")}</p>
                      <p className="text-black text-xs sm:text-sm">{t("payment.declinedMessage")}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissPaymentNotification}
                    className="text-red-600 hover:text-red-700 self-end sm:self-auto"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              ) : (subscription.paymentStatus === "APPROVED" || (typeof subscription.paymentStatus === "string" && subscription.paymentStatus.toLowerCase() === "approved")) ? (
                (subscription.status === "ACTIVE" || (typeof subscription.status === "string" && subscription.status.toLowerCase() === "active")) ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-black dark:text-white font-semibold text-base sm:text-lg">{t("payment.successful")}</p>
                        <p className="text-black dark:text-white text-xs sm:text-sm">{t("payment.successfulMessage")}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissPaymentNotification}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 self-end sm:self-auto"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                ) : null
              ) : (() => {
                const ps = subscription.paymentStatus as string | undefined
                return ps === "PENDING" || (ps && typeof ps === "string" && ps.toLowerCase() === "pending")
              })() ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg p-3 sm:p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-black dark:text-white font-semibold text-base sm:text-lg">{t("payment.inProcess")}</p>
                      <p className="text-black dark:text-white text-xs sm:text-sm">{t("payment.inProcessMessage")}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={dismissPaymentNotification}
                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 self-end sm:self-auto"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 text-black dark:text-white relative z-10">
          <div className="container mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
    </>
  )
}

