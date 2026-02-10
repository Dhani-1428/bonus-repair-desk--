import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { PLAN_PRICING, type SubscriptionPlan } from "@/lib/constants"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { plan, userId, userEmail, userName } = body

    if (!plan || !["SIX_MONTH", "TWELVE_MONTH"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const planDetails = PLAN_PRICING[plan as SubscriptionPlan]
    if (!planDetails) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // Calculate dates
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + planDetails.months)
    endDate.setHours(23, 59, 59, 999)

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${planDetails.name} Subscription - Bonus Repair Desk`,
              description: planDetails.description,
            },
            unit_amount: Math.round(planDetails.price * 100), // Convert to cents
            recurring: undefined, // One-time payment
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing?plan=${plan}&canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId,
        plan,
        planName: planDetails.name,
        price: planDetails.price.toString(),
        months: planDetails.months.toString(),
        startDate: today.toISOString(),
        endDate: endDate.toISOString(),
        userName: userName || "",
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })
  } catch (error: any) {
    console.error("[API] Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session", details: error.message },
      { status: 500 }
    )
  }
}

