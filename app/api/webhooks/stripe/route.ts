import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { query, queryOne, execute, toMySQLDateTime } from "@/lib/mysql"
import { v4 as uuidv4 } from "uuid"
import { sendPaymentApprovedEmail, sendAdminSubscriptionPurchaseNotification } from "@/lib/email-service"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      const { userId, plan, planName, price, months, startDate, endDate } = session.metadata || {}

      if (!userId || !plan || !price) {
        console.error("[Webhook] Missing required metadata in session")
        return NextResponse.json({ error: "Missing required metadata" }, { status: 400 })
      }

      // Get user details
      const user = await queryOne(
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      )

      if (!user) {
        console.error("[Webhook] User not found:", userId)
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Calculate subscription dates
      const subscriptionStartDate = startDate ? new Date(startDate) : new Date()
      subscriptionStartDate.setHours(0, 0, 0, 0)
      
      const subscriptionEndDate = endDate ? new Date(endDate) : new Date()
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + parseInt(months || "6"))
      subscriptionEndDate.setHours(23, 59, 59, 999)

      const subscriptionStartDateMySQL = toMySQLDateTime(subscriptionStartDate)
      const subscriptionEndDateMySQL = toMySQLDateTime(subscriptionEndDate)

      // Check if subscription already exists
      const existing = await queryOne(
        `SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
        [userId]
      )

      let subscriptionId: string
      if (existing) {
        // Update existing subscription
        await execute(
          `UPDATE subscriptions SET 
           plan = ?, status = 'ACTIVE', startDate = ?, endDate = ?, price = ?, 
           paymentStatus = 'APPROVED', paymentId = ?, isFreeTrial = FALSE
           WHERE id = ?`,
          [plan, subscriptionStartDateMySQL, subscriptionEndDateMySQL, parseFloat(price), session.id, existing.id]
        )
        subscriptionId = existing.id
      } else {
        // Create new subscription
        subscriptionId = uuidv4()
        await execute(
          `INSERT INTO subscriptions 
           (id, userId, tenantId, plan, status, startDate, endDate, price, paymentStatus, paymentId, isFreeTrial)
           VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, 'APPROVED', ?, FALSE)`,
          [subscriptionId, userId, user.tenantId, plan, subscriptionStartDateMySQL, subscriptionEndDateMySQL, parseFloat(price), session.id]
        )
      }

      // Get the subscription for email
      const subscription = await queryOne(
        `SELECT * FROM subscriptions WHERE id = ?`,
        [subscriptionId]
      )

      // Send confirmation emails
      try {
        const userForEmail = {
          id: user.id,
          name: user.name,
          email: user.email,
          shopName: user.shopName,
          contactNumber: user.contactNumber,
          role: "USER" as const,
          tenantId: user.tenantId,
          createdAt: user.createdAt,
        }
        await sendPaymentApprovedEmail(userForEmail, subscription)
        await sendAdminSubscriptionPurchaseNotification(userForEmail, subscription)
      } catch (emailError) {
        console.error("[Webhook] Error sending emails:", emailError)
        // Don't fail webhook if email fails
      }

      console.log("[Webhook] ✅ Payment processed successfully for user:", userId)
      return NextResponse.json({ received: true, subscriptionId })
    } catch (error: any) {
      console.error("[Webhook] Error processing payment:", error)
      return NextResponse.json(
        { error: "Error processing payment", details: error.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ received: true })
}
