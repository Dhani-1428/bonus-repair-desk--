import { NextRequest, NextResponse } from "next/server"
import { query, queryOne, execute } from "@/lib/mysql"
import { v4 as uuidv4 } from "uuid"
import { sendAdminSubscriptionPurchaseNotification } from "@/lib/email-service"

// GET subscription for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const subscription = await queryOne(
      `SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
      [userId]
    )

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("[API] Error fetching subscription:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    )
  }
}

// POST create or update subscription
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      plan,
      status,
      startDate,
      endDate,
      price,
      paymentStatus,
      paymentId,
      isFreeTrial,
    } = body

    if (!userId || !plan || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get user to find tenantId
    const user = await queryOne(
      `SELECT tenantId FROM users WHERE id = ?`,
      [userId]
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if subscription exists
    const existing = await queryOne(
      `SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
      [userId]
    )

    let subscription

    if (existing) {
      // Save old subscription to history
      await execute(
        `INSERT INTO subscription_history 
         (id, userId, tenantId, plan, status, startDate, endDate, price, paymentStatus, paymentId, isFreeTrial)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          existing.userId,
          user.tenantId,
          existing.plan,
          existing.status,
          existing.startDate,
          existing.endDate,
          existing.price,
          existing.paymentStatus,
          existing.paymentId,
          existing.isFreeTrial,
        ]
      )

      // Update existing subscription
      await execute(
        `UPDATE subscriptions SET 
         plan = ?, status = ?, startDate = ?, endDate = ?, price = ?, 
         paymentStatus = ?, paymentId = ?, isFreeTrial = ?
         WHERE id = ?`,
        [
          plan,
          status || existing.status,
          startDate,
          endDate,
          price || existing.price,
          paymentStatus || existing.paymentStatus,
          paymentId || existing.paymentId,
          isFreeTrial !== undefined ? isFreeTrial : existing.isFreeTrial,
          existing.id,
        ]
      )

      subscription = await queryOne(
        `SELECT * FROM subscriptions WHERE id = ?`,
        [existing.id]
      )
    } else {
      // Create new subscription
      const subscriptionId = uuidv4()
      await execute(
        `INSERT INTO subscriptions 
         (id, userId, tenantId, plan, status, startDate, endDate, price, paymentStatus, paymentId, isFreeTrial)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          subscriptionId,
          userId,
          user.tenantId,
          plan,
          status || "FREE_TRIAL",
          startDate,
          endDate,
          price || null,
          paymentStatus || null,
          paymentId || null,
          isFreeTrial !== undefined ? isFreeTrial : true,
        ]
      )

      subscription = await queryOne(
        `SELECT * FROM subscriptions WHERE id = ?`,
        [subscriptionId]
      )
    }

    // Send email notification to admin when subscription is created/updated
    // Only send if it's a paid subscription (not free trial) or if status is ACTIVE
    if (subscription && (subscription.status === "ACTIVE" || subscription.status === "active" || subscription.paymentStatus === "APPROVED")) {
      try {
        // Get full user information
        const user = await queryOne(
          `SELECT id, name, email, shopName, contactNumber, tenantId, createdAt FROM users WHERE id = ?`,
          [userId]
        )
        
        if (user) {
          const userForEmail = {
            id: user.id,
            name: user.name,
            email: user.email,
            shopName: user.shopName || null,
            contactNumber: user.contactNumber || null,
            role: "USER" as const,
            tenantId: user.tenantId,
            createdAt: user.createdAt || new Date().toISOString(),
          }
          
          console.log("[API] Sending subscription notification to bonusrepairdesk@gmail.com for subscription:", subscription.id)
          await sendAdminSubscriptionPurchaseNotification(userForEmail, subscription)
          console.log("[API] ✅ Subscription notification sent successfully to bonusrepairdesk@gmail.com")
        }
      } catch (emailError: any) {
        console.error("[API] ❌ Error sending subscription notification:", emailError?.message || emailError)
        // Don't fail subscription creation if email fails
      }
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("[API] Error creating/updating subscription:", error)
    return NextResponse.json(
      { error: "Failed to create/update subscription" },
      { status: 500 }
    )
  }
}
