"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { AlertCircle, CheckCircle, Loader2, Sparkles } from "lucide-react"
import { PLAN_PRICING, type SubscriptionPlan } from "@/lib/constants"
import { useTranslation } from "@/components/language-provider"
import { WebsiteLanguageSelector } from "@/components/website-language-selector"

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    shopName: "",
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    companyEmail: "",
    website: "",
    selectedPlan: null as SubscriptionPlan | null,
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(t("website.register.passwordMismatch"))
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError(t("website.register.passwordTooShort"))
      setLoading(false)
      return
    }

    try {
      // Register with company information
      await register(
        formData.name, 
        formData.email, 
        formData.password, 
        formData.shopName, 
        formData.contactNumber, 
        formData.selectedPlan,
        formData.address,
        formData.companyEmail,
        formData.website
      )
      
      setSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-black via-zinc-900 to-black">
      <div className="absolute top-4 right-4">
        <WebsiteLanguageSelector />
      </div>
      <div className="w-full max-w-4xl space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black font-bold text-xl">
              B
            </div>
            <span className="font-bold text-2xl text-white">Bonus Repair Desk</span>
          </Link>
          <h1 className="text-3xl font-bold mt-4 text-white">{t("website.register.title")}</h1>
          <p className="text-gray-400">{t("website.register.subtitle")}</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">{t("website.register.createAccount")}</CardTitle>
            <CardDescription className="text-gray-400">{t("website.register.fillDetails")}</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="py-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-white">{t("website.register.success")}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {t("website.register.successMessage")}
                  </p>
                  <p className="text-sm text-gray-400">{t("website.register.redirecting")}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Basic Information - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-200 text-sm">
                      {t("website.register.fullName")} <span className="text-red-400">{t("website.register.required")}</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t("website.register.fullName")}
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200 text-sm">
                      {t("website.register.email")} <span className="text-red-400">{t("website.register.required")}</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t("website.login.emailPlaceholder")}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopName" className="text-gray-200 text-sm">
                      {t("website.register.shopName")}
                    </Label>
                    <Input
                      id="shopName"
                      name="shopName"
                      type="text"
                      placeholder={t("website.register.shopName")}
                      value={formData.shopName}
                      onChange={handleChange}
                      disabled={loading}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                    />
                    <p className="text-xs text-gray-500">{t("website.register.shopNameHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="text-gray-200 text-sm">
                      {t("website.register.contactNumber")} <span className="text-red-400">{t("website.register.required")}</span>
                    </Label>
                    <Input
                      id="contactNumber"
                      name="contactNumber"
                      type="tel"
                      placeholder={t("website.register.contactNumber")}
                      value={formData.contactNumber}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                    />
                    <p className="text-xs text-gray-500">{t("website.register.contactHint")}</p>
                  </div>
                </div>

                {/* Company Information - 2 columns */}
                <div className="pt-3 border-t border-zinc-800">
                  <p className="text-sm font-medium text-gray-300 mb-3">{t("website.register.companyInfo")}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-gray-200 text-sm">
                        {t("website.register.address")}
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        type="text"
                        placeholder="Street, City, Postal Code"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail" className="text-gray-200 text-sm">
                        {t("website.register.companyEmail")}
                      </Label>
                      <Input
                        id="companyEmail"
                        name="companyEmail"
                        type="email"
                        placeholder="company@email.com"
                        value={formData.companyEmail}
                        onChange={handleChange}
                        disabled={loading}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-gray-200 text-sm">
                        {t("website.register.website")}
                      </Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        placeholder="www.example.com"
                        value={formData.website}
                        onChange={handleChange}
                        disabled={loading}
                        className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                      />
                    </div>

                  </div>
                </div>

                {/* Password Fields - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-200 text-sm">
                      {t("website.register.password")} <span className="text-red-400">{t("website.register.required")}</span>
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={t("website.register.passwordPlaceholder")}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-200 text-sm">
                      {t("website.register.confirmPassword")} <span className="text-red-400">{t("website.register.required")}</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder={t("website.register.confirmPasswordPlaceholder")}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500 h-10"
                    />
                  </div>
                </div>

                {/* Subscription Plan Selection */}
                <div className="pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <Label className="text-sm font-semibold text-gray-200">
                      {t("website.register.choosePlan")}
                    </Label>
                  </div>
                  <div className="mb-3 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg">
                    <p className="text-sm text-yellow-200 font-semibold mb-1">
                      {t("website.register.freeTrial")}
                    </p>
                    <p className="text-xs text-yellow-300/80">
                      {t("website.register.freeTrialMessage")}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(PLAN_PRICING).map(([planKey, planDetails]) => (
                      <Card
                        key={planKey}
                        className={`cursor-pointer transition-all ${
                          formData.selectedPlan === planKey
                            ? "border-yellow-500 bg-yellow-500/10"
                            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                        }`}
                        onClick={() => !loading && setFormData(prev => ({ ...prev, selectedPlan: planKey as SubscriptionPlan }))}
                      >
                        <CardContent className="p-3">
                          <div className="text-center">
                            <p className="font-semibold text-white text-sm mb-1">{planDetails.name}</p>
                            <p className="text-xs text-gray-400 mb-2">
                              {planKey === "SIX_MONTH" ? t("subscription.sixMonths") : t("subscription.twelveMonths")}
                            </p>
                            <p className="text-lg font-bold text-white">€{planDetails.price}</p>
                            <p className="text-xs text-gray-400">{t("website.register.afterTrial")}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {t("website.register.trialInfo")}
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm border border-red-500/20">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>
                )}

                <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("website.register.creating")}
                    </>
                  ) : (
                    t("website.register.createButton")
                  )}
                </Button>

                <div className="text-xs text-center text-gray-500">
                  {t("website.register.terms")}
                </div>
              </form>
            )}

            {!success && (
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-400">{t("website.register.alreadyHaveAccount")} </span>
                <Link href="/login" className="text-white font-medium hover:underline">
                  {t("website.register.logIn")}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-400">
          <Link href="/" className="hover:text-white transition-colors">
            {t("website.login.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  )
}
