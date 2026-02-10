import { NextRequest, NextResponse } from "next/server"
import { execute, query } from "@/lib/mysql"
import { sendSubscriptionExpiredEmail } from "@/lib/email-service"
import { getDaysUntilExpiration } from "@/lib/subscription-utils"
import type { User, Subscription } from "@/lib/constants"

/**
 * API endpoint to send expired subscription emails to all users with expired subscriptions
 * This can be called manually to send emails immediately
 */
export async function POST(request: NextRequest) {
  try {
    // Get all users with expired subscriptions
    const [userRows] = await execute(
      `SELECT DISTINCT u.id, u.name, u.email, u.role, u.shopName, u.contactNumber, u.tenantId, u.address, u.companyEmail, u.website, u.vatNumber, u.createdAt, u.updatedAt
       FROM users u
       INNER JOIN subscriptions s ON u.id = s.userId
       WHERE s.endDate < CURDATE()
       AND u.role != 'SUPER_ADMIN' AND u.role != 'super_admin'
       AND u.email != 'superadmin@admin.com'`,
      []
    ) as any[]

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No users with expired subscriptions found",
        sent: 0,
        results: []
      })
    }

    const results = []
    let sentCount = 0
    let errorCount = 0

    for (const userRow of userRows) {
      try {
        // Get user's subscription
        const [subscriptionRows] = await execute(
          `SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
          [userRow.id]
        ) as any[]

        if (!subscriptionRows || subscriptionRows.length === 0) {
          continue
        }

        const subscription: Subscription = subscriptionRows[0]
        const daysUntilExpiration = getDaysUntilExpiration(subscription)
        
        // Only process if subscription is expired (daysUntilExpiration < 0)
        if (daysUntilExpiration >= 0) {
          continue
        }

        const daysSinceExpiration = Math.abs(daysUntilExpiration)
        
        // Prepare user object
        const user: User = {
          id: userRow.id,
          name: userRow.name,
          email: userRow.email,
          shopName: userRow.shopName || null,
          contactNumber: userRow.contactNumber || null,
          role: userRow.role || "USER",
          tenantId: userRow.tenantId,
          createdAt: userRow.createdAt || new Date().toISOString(),
        }

        // Send expired subscription email (use 0 days since expiration for initial email)
        const emailSent = await sendSubscriptionExpiredEmail(user, subscription, 0)
        
        if (emailSent) {
          sentCount++
          results.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            companyName: user.shopName || user.name,
            daysSinceExpiration: daysSinceExpiration,
            sent: true,
            message: "Email sent successfully"
          })
          console.log(`[Send Expired Emails] ✅ Email sent to ${user.name} (${user.email}) - ${daysSinceExpiration} days expired`)
        } else {
          errorCount++
          results.push({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            daysSinceExpiration: daysSinceExpiration,
            sent: false,
            message: "Failed to send email"
          })
          console.error(`[Send Expired Emails] ❌ Failed to send email to ${user.name} (${user.email})`)
        }
      } catch (error: any) {
        errorCount++
        console.error(`[Send Expired Emails] Error processing user ${userRow.id}:`, error)
        results.push({
          userId: userRow.id,
          userName: userRow.name,
          userEmail: userRow.email,
          sent: false,
          error: error.message || "Unknown error"
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${userRows.length} users with expired subscriptions`,
      totalUsers: userRows.length,
      emailsSent: sentCount,
      errors: errorCount,
      results: results
    })

  } catch (error: any) {
    console.error("[Send Expired Emails] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send expired subscription emails",
        details: error.message
      },
      { status: 500 }
    )
  }
}
