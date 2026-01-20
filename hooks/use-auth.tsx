"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, Subscription, SubscriptionPlan } from "@/lib/constants"
import { sendWelcomeEmail } from "@/lib/email-service"

interface AuthContextType {
  user: User | null
  subscription: Subscription | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string, shopName?: string, contactNumber?: string, selectedPlan?: SubscriptionPlan, address?: string, companyEmail?: string, website?: string) => Promise<void>
  logout: () => void
  updateSubscription: (subscription: Subscription) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  // Initialize super admin and load user from session storage on mount
  useEffect(() => {
    // Initialize super admin in database if it doesn't exist
    const initSuperAdmin = async () => {
      try {
        const response = await fetch("/api/users")
        const data = await response.json()
        const users = data.users || []
        const superAdminExists = users.some((u: User) => u.email === "superadmin@admin.com")
        
        if (!superAdminExists) {
          // Create super admin
          await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Super Admin",
              email: "superadmin@admin.com",
              password: "superadmin123",
              role: "SUPER_ADMIN",
              shopName: "System Administration",
              contactNumber: "N/A",
            }),
          })
        }
      } catch (error) {
        console.error("Error initializing super admin:", error)
      }
    }

    initSuperAdmin()

    // Load current user from session storage
    const storedUser = sessionStorage.getItem("user")
    const storedSubscription = sessionStorage.getItem("subscription")

    if (storedUser) {
      try {
        if (storedUser.trim().startsWith("{") || storedUser.trim().startsWith("[")) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
          
          // Load subscription from API
          loadSubscription(parsedUser.id)
        } else {
          console.error("Invalid user data in sessionStorage")
          sessionStorage.removeItem("user")
        }
      } catch (error) {
        console.error("Error parsing user from sessionStorage:", error)
        sessionStorage.removeItem("user")
      }
    } else if (storedSubscription) {
      try {
        if (storedSubscription.trim().startsWith("{") || storedSubscription.trim().startsWith("[")) {
          const parsedSubscription = JSON.parse(storedSubscription)
          setSubscription(parsedSubscription)
        } else {
          console.error("Invalid subscription data in sessionStorage")
          sessionStorage.removeItem("subscription")
        }
      } catch (error) {
        console.error("Error parsing subscription from sessionStorage:", error)
        sessionStorage.removeItem("subscription")
      }
    }

    setLoading(false)
  }, [])

  const loadSubscription = async (userId: string) => {
    try {
      const response = await fetch(`/api/subscriptions?userId=${userId}`)
      const data = await response.json()
      if (data.subscription) {
        const sub = data.subscription
        const subscriptionData: Subscription = {
          id: sub.id,
          userId: sub.userId,
          plan: sub.plan,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          price: sub.price,
          paymentStatus: sub.paymentStatus,
          paymentId: sub.paymentId,
          isFreeTrial: sub.isFreeTrial,
        }
        setSubscription(subscriptionData)
        sessionStorage.setItem("subscription", JSON.stringify(subscriptionData))
      }
    } catch (error) {
      console.error("Error loading subscription:", error)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      let response: Response
      try {
        // Add timeout and better error handling for fetch
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout
        
        response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
      } catch (fetchError: any) {
        console.error("[Login] Network error:", fetchError?.message || fetchError)
        
        // Handle specific connection errors
        if (fetchError?.name === "AbortError") {
          throw new Error("Request timed out. Please check your connection and try again.")
        }
        if (fetchError?.message?.includes("ECONNRESET") || fetchError?.message?.includes("Connection lost")) {
          throw new Error("Connection was reset. Please try again in a moment.")
        }
        if (fetchError?.message?.includes("Failed to fetch") || fetchError?.message?.includes("NetworkError")) {
          throw new Error("Network error. Please check your internet connection and try again.")
        }
        
        throw new Error("Network error. Please check your connection and try again.")
      }

      let data: any = null
      let responseText = ""
      try {
        responseText = await response.text()
        if (!responseText) {
          console.error("[Login] Empty response from server")
          console.error("[Login] Response status:", response.status, response.statusText)
          throw new Error("Empty response from server. Please try again.")
        }
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          // If JSON parsing fails, create a structured error object
          console.error("[Login] Failed to parse JSON:", parseError)
          data = {
            error: `Server returned invalid response (${response.status} ${response.statusText})`,
            rawResponse: responseText.substring(0, 200)
          }
        }
      } catch (jsonError: any) {
        console.error("[Login] Failed to get response text:", jsonError?.message || jsonError)
        console.error("[Login] Response status:", response.status, response.statusText)
        // Create a fallback error object
        data = {
          error: `Failed to read server response (${response.status} ${response.statusText})`,
          details: jsonError?.message
        }
      }

      if (!response.ok) {
        // Safely get response properties
        const status = typeof response?.status === "number" ? response.status : "unknown"
        const statusText = response?.statusText || "unknown"
        
        // Try to extract error message from various possible fields
        const errorMessage = 
          data?.error || 
          data?.message || 
          data?.details || 
          (typeof data === "string" ? data : null) ||
          `Login failed (${status} ${statusText})`
        
        // Build error details object with explicit property assignment to ensure serialization
        const errorDetails: Record<string, string> = {}
        errorDetails.status = String(status)
        errorDetails.statusText = String(statusText)
        errorDetails.error = String(errorMessage || "Unknown error")
        
        // Safely add data if available
        if (data !== null && data !== undefined) {
          if (typeof data === "object") {
            try {
              errorDetails.data = JSON.stringify(data, null, 2)
            } catch (e) {
              errorDetails.data = String(data)
            }
          } else {
            errorDetails.data = String(data)
          }
        } else {
          errorDetails.data = "No data"
        }
        
        // Safely add raw response text if available
        if (responseText && typeof responseText === "string" && responseText.trim()) {
          errorDetails.rawResponse = responseText.substring(0, 500)
        } else {
          errorDetails.rawResponse = "No response text"
        }
        
        // Log with explicit values to ensure visibility
        console.error("[Login] API Error:", {
          status: errorDetails.status,
          statusText: errorDetails.statusText,
          error: errorDetails.error,
          data: errorDetails.data,
          rawResponse: errorDetails.rawResponse
        })
        
        // Provide more specific error messages based on status code
        if (status === 401) {
          throw new Error("Invalid email or password. Please check your credentials and try again.")
        } else if (status === 500) {
          throw new Error(errorMessage || "Server error. Please try again later.")
        } else {
          throw new Error(errorMessage)
        }
      }

      if (!data || !data.user) {
        console.error("[Login] Missing user data in response:", data)
        throw new Error("Invalid response: user data not found")
      }

      const userData = data.user
      console.log("[Login] User data received:", { id: userData.id, email: userData.email, role: userData.role })

      // Skip subscription check for super admin
      // Check role (case-insensitive) or email
      const isSuperAdmin = 
        userData.role === "SUPER_ADMIN" || 
        userData.role === "super_admin" || 
        userData.email === "superadmin@admin.com" ||
        userData.email?.toLowerCase() === "superadmin@admin.com"
      
      if (isSuperAdmin) {
        console.log("[Login] Super admin detected, skipping subscription check")
        setUser(userData)
        sessionStorage.setItem("user", JSON.stringify(userData))
        sessionStorage.setItem("auth-token", "demo-token")
        return userData
      }

      // Check subscription status for regular users
      try {
        const subResponse = await fetch(`/api/subscriptions?userId=${userData.id}`)
        if (!subResponse.ok) {
          console.warn("[Login] Failed to fetch subscription, but allowing login:", subResponse.status)
          // Don't block login if subscription check fails - allow user to proceed
        } else {
          const subData = await subResponse.json()
          const sub = subData.subscription

          if (sub) {
            const now = new Date()
            const endDate = new Date(sub.endDate)
            const isExpired = endDate < now
            const isFreeTrial = sub.status === "FREE_TRIAL" || sub.status === "free_trial" || sub.isFreeTrial
            const paymentStatus = sub.paymentStatus || "PENDING"
            const isPaymentApproved = paymentStatus === "APPROVED"
            
            // Block login if subscription is expired
            if (isExpired) {
              if (isFreeTrial) {
                throw new Error("Your free trial has ended. Please subscribe to continue using the admin panel.")
              } else {
                throw new Error("Your subscription has expired. Please renew your subscription to continue using the admin panel.")
              }
            }

            // Block login if payment is not approved (unless it's a free trial)
            if (!isFreeTrial && !isPaymentApproved) {
              throw new Error("Your payment is pending approval. Please wait for admin approval or contact support.")
            }
          } else {
            // No subscription found - block login and redirect to subscription
            throw new Error("No active subscription found. Please subscribe to access the admin panel.")
          }
        }
      } catch (subError: any) {
        // If subscription check fails, log but don't block login
        console.error("[Login] Error checking subscription:", subError)
        // Only throw if it's a subscription-related error (expired, etc.)
        if (subError instanceof Error && subError.message.includes("subscription") || subError.message.includes("trial")) {
          throw subError
        }
      }

      setUser(userData)
      sessionStorage.setItem("user", JSON.stringify(userData))
      sessionStorage.setItem("auth-token", "demo-token")

      // Load subscription
      await loadSubscription(userData.id)

      return userData
    } catch (error: any) {
      // If error is already an Error object with a message, log and throw it as is
      if (error instanceof Error) {
        // Handle database hostname resolution errors
        if (
          error.message.includes("Cannot resolve database hostname") ||
          error.message.includes("ENOTFOUND") ||
          error.message.includes("getaddrinfo") ||
          error.message.includes("database hostname") ||
          error.message.includes("Database connection failed")
        ) {
          console.warn("[Login] Database configuration issue detected:", {
            message: error.message,
            suggestion: "Please check your database configuration (DB_HOST environment variable) and ensure the database server is accessible.",
            diagnosticUrl: "/api/diagnose-db"
          })
          // Provide a more helpful error message with guidance
          const helpfulMessage = error.message.includes("Cannot resolve") || error.message.includes("hostname")
            ? "Database connection failed: Cannot resolve database hostname. Please check your database configuration in Vercel environment variables. Visit /api/diagnose-db for detailed setup instructions."
            : "Database connection failed. Please check your database configuration and ensure the database server is accessible. Visit /api/diagnose-db for diagnostic information."
          throw new Error(helpfulMessage)
        }
        // Handle connection reset errors with a user-friendly message
        if (error.message.includes("ECONNRESET") || error.message.includes("Connection lost")) {
          console.warn("[Login] Database connection reset:", {
            message: error.message,
            suggestion: "This may be a temporary issue. Please try again in a moment."
          })
          throw new Error("Database connection was lost. Please try again in a moment.")
        }
        // Handle generic database connection errors
        if (
          error.message.includes("Database connection") ||
          error.message.includes("database connection") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("ETIMEDOUT")
        ) {
          console.warn("[Login] Database connection issue:", {
            message: error.message,
            suggestion: "Please check your database configuration or contact support.",
            diagnosticUrl: "/api/diagnose-db"
          })
          // Check if the error already contains helpful information
          if (error.message.includes("diagnose-db") || error.message.includes("Vercel")) {
            throw error // Use the original error if it already has helpful info
          }
          throw new Error("Unable to connect to the database. Please check your database configuration. Visit /api/diagnose-db for diagnostic information.")
        }
        console.error("[Login] Error:", error.message, error)
        throw error
      }
      // Otherwise, create a new Error with a meaningful message
      const errorMessage = error?.message || error?.error || "Login failed. Please try again."
      console.error("[Login] Unknown error:", error)
      throw new Error(errorMessage)
    }
  }

  const register = async (
    name: string,
    email: string,
    password: string,
    shopName?: string,
    contactNumber?: string,
    selectedPlan?: SubscriptionPlan,
    address?: string,
    companyEmail?: string,
    website?: string
  ) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          shopName,
          contactNumber,
          selectedPlan: selectedPlan || "MONTHLY",
          address,
          companyEmail,
          website,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // Send welcome email with credentials
      try {
        const userForEmail = {
          id: data.user?.id || "",
          name: name,
          email: email,
          role: "USER" as const,
          shopName: data.user?.shopName || null,
          contactNumber: data.user?.contactNumber || null,
          tenantId: data.user?.tenantId || "",
          createdAt: data.user?.createdAt || new Date().toISOString(),
        }
        await sendWelcomeEmail(userForEmail, password)
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError)
        // Don't fail registration if email fails
      }

      // Auto-login after registration
      await login(email, password)
    } catch (error: any) {
      console.error("Registration error:", error)
      throw error
    }
  }

  const logout = async () => {
    // Send emails about logout (non-blocking)
    if (user) {
      try {
        const { sendAdminLogoutNotification, sendLogoutEmail } = await import("@/lib/email-service")
        
        // Send email to user
        await sendLogoutEmail(user)
        
        // Send notification to admin (skip for super admin)
        if (user.role !== "SUPER_ADMIN" && user.role !== "super_admin") {
          await sendAdminLogoutNotification(user)
        }
      } catch (emailError) {
        console.error("Error sending logout emails:", emailError)
        // Don't fail logout if email fails
      }
    }

    setUser(null)
    setSubscription(null)
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("subscription")
    sessionStorage.removeItem("auth-token")
    window.location.href = "/login"
  }

  const updateSubscription = async (subscriptionData: Subscription) => {
    try {
      // Try to update via API first
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: subscriptionData.userId,
          plan: subscriptionData.plan,
          status: subscriptionData.status,
          startDate: subscriptionData.startDate,
          endDate: subscriptionData.endDate,
          price: subscriptionData.price,
          paymentStatus: subscriptionData.paymentStatus,
          paymentId: subscriptionData.paymentId,
          isFreeTrial: subscriptionData.isFreeTrial,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          const updatedSub = data.subscription
          const sub: Subscription = {
            id: updatedSub.id,
            userId: updatedSub.userId,
            plan: updatedSub.plan,
            status: updatedSub.status,
            startDate: updatedSub.startDate,
            endDate: updatedSub.endDate,
            price: updatedSub.price,
            paymentStatus: updatedSub.paymentStatus,
            paymentId: updatedSub.paymentId,
            isFreeTrial: updatedSub.isFreeTrial,
          }

          setSubscription(sub)
          sessionStorage.setItem("subscription", JSON.stringify(sub))
          // Also save to localStorage for backup
          if (typeof window !== "undefined") {
            localStorage.setItem(`subscription_${subscriptionData.userId}`, JSON.stringify(sub))
          }
          return
        }
      }
      
      // If API fails, fall back to localStorage/sessionStorage only
      console.warn("API subscription update failed, using localStorage fallback")
    } catch (error: any) {
      console.warn("Error updating subscription via API, using localStorage fallback:", error)
    }

    // Fallback: Update localStorage and sessionStorage directly
    try {
      setSubscription(subscriptionData)
      sessionStorage.setItem("subscription", JSON.stringify(subscriptionData))
      if (typeof window !== "undefined") {
        localStorage.setItem(`subscription_${subscriptionData.userId}`, JSON.stringify(subscriptionData))
      }
    } catch (error: any) {
      console.error("Error updating subscription in storage:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        login,
        register,
        logout,
        updateSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
