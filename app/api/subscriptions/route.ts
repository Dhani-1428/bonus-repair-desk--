import { NextRequest, NextResponse } from "next/server"
import { query, queryOne, execute, toMySQLDateTime } from "@/lib/mysql"
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
    console.log("[API] Subscription POST request body:", {
      userId: body.userId,
      plan: body.plan,
      status: body.status,
      startDate: body.startDate,
      endDate: body.endDate,
      price: body.price,
      hasPaymentStatus: !!body.paymentStatus,
      hasPaymentId: !!body.paymentId,
      isFreeTrial: body.isFreeTrial
    })
    
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
      console.error("[API] Missing required fields:", {
        hasUserId: !!userId,
        hasPlan: !!plan,
        hasStartDate: !!startDate,
        hasEndDate: !!endDate
      })
      return NextResponse.json(
        { error: "Missing required fields: userId, plan, startDate, and endDate are required" },
        { status: 400 }
      )
    }

    // Get user to find tenantId
    console.log("[API] Fetching user for tenantId:", userId)
    const user = await queryOne(
      `SELECT tenantId FROM users WHERE id = ?`,
      [userId]
    )

    if (!user) {
      console.error("[API] User not found:", userId)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    console.log("[API] User found, tenantId:", user.tenantId)
    
    // Convert dates to MySQL format
    const startDateMySQL = toMySQLDateTime(startDate)
    const endDateMySQL = toMySQLDateTime(endDate)
    
    console.log("[API] Date conversion:", {
      startDateOriginal: startDate,
      startDateMySQL: startDateMySQL,
      endDateOriginal: endDate,
      endDateMySQL: endDateMySQL
    })

    // Check if subscription exists
    console.log("[API] Checking for existing subscription for userId:", userId)
    const existing = await queryOne(
      `SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
      [userId]
    )

    let subscription

    if (existing) {
      console.log("[API] Existing subscription found, updating:", existing.id)
      // Save old subscription to history
      try {
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
            toMySQLDateTime(existing.startDate),
            toMySQLDateTime(existing.endDate),
            existing.price,
            existing.paymentStatus,
            existing.paymentId,
            existing.isFreeTrial,
          ]
        )
        console.log("[API] ✅ Saved subscription to history")
      } catch (historyError: any) {
        console.error("[API] ⚠️  Failed to save to history (non-critical):", historyError?.message || historyError)
        // Continue even if history save fails
      }

      // Update existing subscription
      console.log("[API] Updating subscription with:", {
        plan,
        status: status || existing.status,
        startDate: startDateMySQL,
        endDate: endDateMySQL,
        price: price || existing.price,
        paymentStatus: paymentStatus || existing.paymentStatus,
        paymentId: paymentId || existing.paymentId,
        isFreeTrial: isFreeTrial !== undefined ? isFreeTrial : existing.isFreeTrial
      })
      
      await execute(
        `UPDATE subscriptions SET 
         plan = ?, status = ?, startDate = ?, endDate = ?, price = ?, 
         paymentStatus = ?, paymentId = ?, isFreeTrial = ?
         WHERE id = ?`,
        [
          plan,
          status || existing.status,
          startDateMySQL,
          endDateMySQL,
          price !== undefined ? price : existing.price,
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
      console.log("[API] ✅ Subscription updated successfully")
    } else {
      console.log("[API] No existing subscription, creating new one")
      // Create new subscription
      const subscriptionId = uuidv4()
      console.log("[API] Creating subscription with:", {
        subscriptionId,
        userId,
        tenantId: user.tenantId,
        plan,
        status: status || "FREE_TRIAL",
        startDate: startDateMySQL,
        endDate: endDateMySQL,
        price: price || null,
        paymentStatus: paymentStatus || null,
        paymentId: paymentId || null,
        isFreeTrial: isFreeTrial !== undefined ? isFreeTrial : true
      })
      
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
          startDateMySQL,
          endDateMySQL,
          price !== undefined ? price : null,
          paymentStatus || null,
          paymentId || null,
          isFreeTrial !== undefined ? isFreeTrial : true,
        ]
      )

      subscription = await queryOne(
        `SELECT * FROM subscriptions WHERE id = ?`,
        [subscriptionId]
      )
      console.log("[API] ✅ Subscription created successfully")
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
  } catch (error: any) {
    console.error("[API] Error creating/updating subscription:", error)
    console.error("[API] Error details:", {
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      message: error?.message,
      stack: error?.stack?.substring(0, 500)
    })
    
    // Provide more specific error messages
    let errorMessage = "Failed to create/update subscription"
    if (error?.code === "ER_CON_COUNT_ERROR" || error?.errno === 1040) {
      errorMessage = "Database is temporarily busy. Please try again in a moment."
    } else if (error?.code === "ER_NO_SUCH_TABLE") {
      errorMessage = "Database table not found. Please check database setup."
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === "development" ? error?.message : undefined },
      { status: 500 }
    )
  }
}
