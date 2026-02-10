"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, user, loading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // Check if user is super admin (check role or email)
      const isSuperAdmin = 
        user.role === "SUPER_ADMIN" || 
        user.role === "super_admin" || 
        user.email === "superadmin@admin.com" ||
        user.email?.toLowerCase() === "superadmin@admin.com"
      
      if (isSuperAdmin) {
        router.replace("/super-admin")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [user, authLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const loggedInUser = await login(formData.email, formData.password)
      
      // Verify user was saved to sessionStorage
      const savedUser = sessionStorage.getItem("user")
      if (!savedUser) {
        throw new Error("Login failed. Please try again.")
      }
      
      // Wait a bit for state to update, then redirect
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Check for redirect parameter
      const redirectTo = searchParams.get("redirect")
      
      // Check if user is super admin and redirect accordingly (check role or email)
      const isSuperAdmin = 
        loggedInUser && (
          loggedInUser.role === "super_admin" || 
          loggedInUser.role === "SUPER_ADMIN" ||
          loggedInUser.email === "superadmin@admin.com" ||
          loggedInUser.email?.toLowerCase() === "superadmin@admin.com"
        )
      
      if (isSuperAdmin) {
        router.replace(redirectTo || "/super-admin")
      } else {
        router.replace(redirectTo || "/dashboard")
      }
      // Don't set loading to false here as we're redirecting
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black font-bold text-xl">
              B
            </div>
            <span className="font-bold text-2xl text-white">Bonus Repair Desk</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4 text-white">Welcome Back</h1>
          <p className="text-gray-400">Log in to access your admin panel</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Log in to your account</CardTitle>
            <CardDescription className="text-gray-400">Enter your credentials to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-200">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
                />
              </div>

              {error && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                    <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Access Denied</p>
                      <p className="text-red-300">{error}</p>
                    </div>
                  </div>
                  {(error.includes("subscription") || error.includes("expired") || error.includes("No subscription")) && (
                    <Link href="/subscription">
                      <Button 
                        type="button" 
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Go to Subscription Page
                      </Button>
                    </Link>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">Don't have an account? </span>
              <Link href="/register" className="text-white font-medium hover:underline">
                Sign up
              </Link>
            </div>
            
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
