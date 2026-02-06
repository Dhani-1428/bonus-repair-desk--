"use client"

import { motion } from "framer-motion"
import { Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useTranslation } from "@/components/language-provider"
import type { SubscriptionPlan } from "@/lib/constants"

const pricingPlans = [
  {
    name: "Free Trial",
    price: 0,
    duration: "15 days",
    description: "Try all features risk-free",
    popular: false,
    planId: null as SubscriptionPlan | null,
  },
  {
    name: "6 Months",
    price: 100,
    duration: "6 months", // Will be translated in component
    description: "Great value for medium-term needs",
    popular: true,
    planId: "SIX_MONTH" as SubscriptionPlan,
  },
  {
    name: "12 Months",
    price: 150,
    duration: "12 months", // Will be translated in component
    description: "Best value for long-term commitment",
    popular: false,
    planId: "TWELVE_MONTH" as SubscriptionPlan,
  },
]

export function PricingSection() {
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useTranslation()

  const handleSubscribe = (plan: typeof pricingPlans[0]) => {
    if (plan.planId === null) {
      // Free trial - redirect to register if not logged in, or show message if logged in
      if (!user) {
        router.push("/register")
      } else {
        // User is already logged in, they might already have a trial
        router.push("/subscription")
      }
      return
    }

    // For paid plans, redirect to billing page with plan selected
    if (!user) {
      router.push(`/login?redirect=/billing?plan=${plan.planId}`)
    } else {
      router.push(`/billing?plan=${plan.planId}`)
    }
  }

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-gray-900/50 to-black/50 border border-gray-800/50 backdrop-blur-sm mb-6 shadow-lg"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white/80">Pricing</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent mb-4">
            Choose your plan
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-8">
            Start with a 15-day free trial, then choose from our flexible subscription plans. All plans include full access to all features.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className={`relative rounded-2xl p-8 backdrop-blur-sm border transition-all duration-300 ${
                plan.popular
                  ? "bg-gradient-to-br from-gray-900/50 via-black/50 to-gray-900/50 border-blue-500/30 shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30"
                  : "bg-gradient-to-br from-gray-900/30 via-black/30 to-gray-900/30 border-gray-800/50 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">€{plan.price}</span>
                </div>
                <p className="text-white/60 text-sm mb-1">{plan.duration === "6 months" ? t("subscription.sixMonths") : plan.duration === "12 months" ? t("subscription.twelveMonths") : plan.duration}</p>
                <p className="text-white/60 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#e78a53] flex-shrink-0" />
                  <span className="text-white/80 text-sm">Repair device management</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#e78a53] flex-shrink-0" />
                  <span className="text-white/80 text-sm">Customer database</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#e78a53] flex-shrink-0" />
                  <span className="text-white/80 text-sm">Payment processing</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#e78a53] flex-shrink-0" />
                  <span className="text-white/80 text-sm">Analytics & reports</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#e78a53] flex-shrink-0" />
                  <span className="text-white/80 text-sm">Email support</span>
                </li>
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/20"
                    : plan.planId === null
                    ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/20"
                    : "bg-gradient-to-r from-gray-800/50 to-gray-900/50 text-white border border-gray-700/50 hover:border-blue-500/50 hover:bg-gray-800"
                }`}
              >
                {plan.planId === null ? "Start Free Trial" : "Subscribe"}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
