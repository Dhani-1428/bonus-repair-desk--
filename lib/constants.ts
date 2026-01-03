export type SubscriptionPlan = "MONTHLY" | "THREE_MONTH" | "SIX_MONTH" | "TWELVE_MONTH"

export type SubscriptionStatus = "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING" | "FREE_TRIAL"
export type PaymentStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface User {
  id: string
  name: string
  email: string
  password?: string // Only stored in localStorage, not returned to client
  shopName?: string
  contactNumber?: string
  role?: "admin" | "member" | "super_admin"
  createdAt: string
  address?: string | null
  companyEmail?: string | null
  website?: string | null
  vatNumber?: string | null
  tenantId?: string
}

export interface Subscription {
  id: string
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  startDate: string
  endDate: string
  price?: number
  paymentStatus?: PaymentStatus
  paymentId?: string
  isFreeTrial?: boolean
  createdAt: string
}

export const PLAN_PRICING = {
  SIX_MONTH: {
    name: "6 Months",
    price: 100,
    months: 6,
    features: [
      "Everything in 3 Months",
      "Advanced Analytics",
      "Priority Support",
      "Custom Reports",
      "API Access",
      "Data Export",
    ],
  },
  TWELVE_MONTH: {
    name: "12 Months",
    price: 150,
    months: 12,
    features: [
      "Everything in 6 Months",
      "Unlimited Tickets",
      "Dedicated Support",
      "Custom Integrations",
      "White Label Options",
      "Advanced Security",
    ],
  },
}
