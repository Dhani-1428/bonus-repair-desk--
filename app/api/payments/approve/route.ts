import { NextRequest, NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/mysql"
import { v4 as uuidv4 } from "uuid"
import { sendPaymentApprovedEmail, sendAdminSubscriptionPurchaseNotification, sendPaymentReceiptEmail } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("paymentId")
    const token = searchParams.get("token")

    if (!paymentId || !token) {
      return NextResponse.json(
        { error: "Payment ID and token are required" },
        { status: 400 }
      )
    }

    // Verify token (simple verification - in production, use a more secure method)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [id, userId] = decoded.split(':')
      if (id !== paymentId) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 401 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 401 }
      )
    }

    // Fetch payment request
    const payment = await queryOne(
      `SELECT 
        p.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.shopName as user_shopName,
        u.contactNumber as user_contactNumber
       FROM payment_requests p
       LEFT JOIN users u ON p.userId = u.id
       WHERE p.id = ?`,
      [paymentId]
    )

    if (!payment) {
      return NextResponse.json(
        { error: "Payment request not found" },
        { status: 404 }
      )
    }

    if (payment.status !== "PENDING") {
      return NextResponse.redirect(new URL(`/super-admin/payments?message=${encodeURIComponent(`Payment already ${payment.status.toLowerCase()}`)}`, request.url))
    }

    // Approve payment
    await execute(
      `UPDATE payment_requests SET status = 'APPROVED' WHERE id = ?`,
      [paymentId]
    )

    // Activate subscription
    const existing = await queryOne(
      `SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
      [payment.userId]
    )

    if (existing) {
      // Save to history
      await execute(
        `INSERT INTO subscription_history 
         (id, userId, tenantId, plan, status, startDate, endDate, price, paymentStatus, paymentId, isFreeTrial)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          existing.userId,
          payment.tenantId,
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
    }

    // Update or create subscription
    // When payment is approved, start subscription IMMEDIATELY (today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    today.setMinutes(0, 0, 0)
    today.setSeconds(0, 0)
    today.setMilliseconds(0)
    
    // Calculate end date based on plan months from today
    const planMonths = payment.months || 6 // Default to 6 months if not specified
    const subscriptionEndDate = new Date(today)
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + planMonths)
    subscriptionEndDate.setHours(23, 59, 59, 999) // End of day
    
    // Convert to MySQL datetime format
    const startDateMySQL = today.toISOString().slice(0, 19).replace('T', ' ')
    const endDateMySQL = subscriptionEndDate.toISOString().slice(0, 19).replace('T', ' ')
    
    let subscriptionId: string
    if (existing) {
      await execute(
        `UPDATE subscriptions SET 
         plan = ?, status = 'ACTIVE', startDate = ?, endDate = ?, price = ?, 
         paymentStatus = 'APPROVED', paymentId = ?, isFreeTrial = FALSE
         WHERE id = ?`,
        [payment.plan, startDateMySQL, endDateMySQL, payment.price, paymentId, existing.id]
      )
      subscriptionId = existing.id
    } else {
      subscriptionId = uuidv4()
      await execute(
        `INSERT INTO subscriptions 
         (id, userId, tenantId, plan, status, startDate, endDate, price, paymentStatus, paymentId, isFreeTrial)
         VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, 'APPROVED', ?, FALSE)`,
        [subscriptionId, payment.userId, payment.tenantId, payment.plan, startDateMySQL, endDateMySQL, payment.price, paymentId]
      )
    }

    // Send emails
    try {
      const subscription = await queryOne(
        `SELECT * FROM subscriptions WHERE id = ?`,
        [subscriptionId]
      )
      if (subscription && payment.user_id) {
        const user = {
          id: payment.user_id,
          name: payment.user_name,
          email: payment.user_email,
          shopName: payment.user_shopName,
          contactNumber: payment.user_contactNumber,
          role: "USER" as const,
          tenantId: payment.tenantId,
          createdAt: new Date().toISOString(),
        }
        await sendPaymentApprovedEmail(user, subscription)
        await sendAdminSubscriptionPurchaseNotification(user, subscription)
      }
    } catch (emailError) {
      console.error("[API] Error sending approval emails:", emailError)
    }

    // Redirect to admin panel with success message
    const baseUrl = new URL(request.url).origin
    return NextResponse.redirect(new URL(`/super-admin/payments?message=${encodeURIComponent("Payment approved successfully!")}`, baseUrl))
  } catch (error) {
    console.error("[API] Error approving payment:", error)
    const baseUrl = new URL(request.url).origin
    return NextResponse.redirect(new URL(`/super-admin/payments?error=${encodeURIComponent("Failed to approve payment")}`, baseUrl))
  }
}

