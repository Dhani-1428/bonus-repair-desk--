import { NextRequest, NextResponse } from "next/server"
import { execute } from "@/lib/mysql"
import { getDaysUntilExpiration, getSubscriptionEndDate } from "@/lib/subscription-utils"
import { send7DaysReminderEmail, sendFreeTrialEndingEmail, sendAdminSubscriptionEndingNotification } from "@/lib/email-service"
import type { User, Subscription } from "@/lib/constants"

/**
 * API route to check and send subscription expiry notifications
 * This runs server-side to properly send emails
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    // If userId is provided, check only that user's subscription
    // Otherwise, check all active subscriptions
    let users: User[] = []

    if (userId) {
      const [userRows] = await execute(
        `SELECT id, name, email, role, shopName, contactNumber, tenantId, address, companyEmail, website, vatNumber, createdAt, updatedAt
         FROM users
         WHERE id = ?`,
        [userId]
      ) as any[]

      if (userRows && userRows.length > 0) {
        users = [userRows[0]]
      }
    } else {
      // Get all users with active subscriptions
      const [userRows] = await execute(
        `SELECT DISTINCT u.id, u.name, u.email, u.role, u.shopName, u.contactNumber, u.tenantId, u.address, u.companyEmail, u.website, u.vatNumber, u.createdAt, u.updatedAt
         FROM users u
         INNER JOIN subscriptions s ON u.id = s.userId
         WHERE s.status IN ('ACTIVE', 'active', 'FREE_TRIAL', 'free_trial')
         AND s.endDate >= CURDATE()`,
        []
      ) as any[]

      users = userRows || []
    }

    const results = []

    for (const user of users) {
      try {
        // Get user's subscription
        const [subscriptionRows] = await execute(
          `SELECT * FROM subscriptions WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`,
          [user.id]
        ) as any[]

        if (!subscriptionRows || subscriptionRows.length === 0) {
          continue
        }

        const subscription: Subscription = subscriptionRows[0]
        const daysUntilExpiration = getDaysUntilExpiration(subscription)

        // Skip if subscription is not expiring within 7 days
        if (daysUntilExpiration > 7 || daysUntilExpiration < 0) {
          continue
        }

        // Check if notification was already sent today (using database)
        const today = new Date().toISOString().split('T')[0]
        const notificationKey = `subscription_notification_${subscription.id}_${daysUntilExpiration}_${today}`
        
        // Check if we've already sent this notification today (with graceful fallback if table doesn't exist)
        let alreadySent = false
        try {
          const [existingNotifications] = await execute(
            `SELECT * FROM email_notifications 
             WHERE userId = ? AND notificationType = ? AND DATE(createdAt) = CURDATE()`,
            [user.id, notificationKey]
          ) as any[]

          if (existingNotifications && existingNotifications.length > 0) {
            alreadySent = true
          }
        } catch (error: any) {
          // Table might not exist yet, continue without duplicate check
          console.warn("[check-subscription-expiry] email_notifications table may not exist:", error.message)
        }

        if (alreadySent) {
          continue // Already sent today
        }

        // Determine if it's a free trial
        const endDate = new Date(subscription.endDate)
        const startDate = new Date(subscription.startDate)
        const isFreeTrial = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) <= 31

        // Use companyEmail if available, otherwise fall back to user.email
        const emailToSend = user.companyEmail || user.email

        // Send appropriate email based on subscription type and days left
        if (isFreeTrial && daysUntilExpiration <= 7 && daysUntilExpiration >= 0) {
          // Send free trial ending email
          await sendFreeTrialEndingEmail({ ...user, email: emailToSend }, subscription)
          
          // Mark as sent (with graceful fallback if table doesn't exist)
          try {
            await execute(
              `INSERT INTO email_notifications (id, userId, notificationType, createdAt)
               VALUES (UUID(), ?, ?, NOW())
               ON DUPLICATE KEY UPDATE createdAt = NOW()`,
              [user.id, notificationKey]
            )
          } catch (error: any) {
            console.warn("[check-subscription-expiry] Could not save notification to database:", error.message)
          }

          results.push({
            userId: user.id,
            email: emailToSend,
            type: "free_trial_ending",
            daysLeft: daysUntilExpiration,
            sent: true
          })
        } else if (daysUntilExpiration === 7) {
          // Send 7 days reminder
          await send7DaysReminderEmail({ ...user, email: emailToSend }, subscription)
          
          // Mark as sent (with graceful fallback if table doesn't exist)
          try {
            await execute(
              `INSERT INTO email_notifications (id, userId, notificationType, createdAt)
               VALUES (UUID(), ?, ?, NOW())
               ON DUPLICATE KEY UPDATE createdAt = NOW()`,
              [user.id, notificationKey]
            )
          } catch (error: any) {
            console.warn("[check-subscription-expiry] Could not save notification to database:", error.message)
          }

          results.push({
            userId: user.id,
            email: emailToSend,
            type: "7_days_reminder",
            daysLeft: daysUntilExpiration,
            sent: true
          })
        }

        // Always send admin notification if subscription is ending within 7 days
        if (daysUntilExpiration <= 7 && daysUntilExpiration >= 0) {
          const adminNotificationKey = `admin_notification_${subscription.id}_${daysUntilExpiration}_${today}`
          let adminAlreadySent = false
          try {
            const [existingAdminNotifications] = await execute(
              `SELECT * FROM email_notifications 
               WHERE userId = ? AND notificationType = ? AND DATE(createdAt) = CURDATE()`,
              [user.id, adminNotificationKey]
            ) as any[]

            if (existingAdminNotifications && existingAdminNotifications.length > 0) {
              adminAlreadySent = true
            }
          } catch (error: any) {
            console.warn("[check-subscription-expiry] Could not check admin notifications:", error.message)
          }

          if (!adminAlreadySent) {
            await sendAdminSubscriptionEndingNotification({ ...user, email: emailToSend }, subscription, daysUntilExpiration)
            
            // Mark admin notification as sent (with graceful fallback)
            try {
              await execute(
                `INSERT INTO email_notifications (id, userId, notificationType, createdAt)
                 VALUES (UUID(), ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE createdAt = NOW()`,
                [user.id, adminNotificationKey]
              )
            } catch (error: any) {
              console.warn("[check-subscription-expiry] Could not save admin notification to database:", error.message)
            }
          }
        }

      } catch (error: any) {
        console.error(`Error processing subscription for user ${user.id}:`, error)
        results.push({
          userId: user.id,
          error: error.message,
          sent: false
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked: users.length,
      sent: results.filter(r => r.sent).length,
      results
    })

  } catch (error: any) {
    console.error("[check-subscription-expiry] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check subscription expiry",
        details: error.message
      },
      { status: 500 }
    )
  }
}

