import type { Subscription, User } from "@/lib/constants"
import { isExpiringSoon, getDaysUntilExpiration, isExpired, getSubscriptionEndDate } from "./subscription-utils"
import { send7DaysReminderEmail, sendFreeTrialEndingEmail, sendAdminSubscriptionEndingNotification } from "./email-service"

/**
 * Send email notification for expiring subscriptions
 */
export async function sendSubscriptionExpiryNotification(
  subscription: Subscription,
  user: User
): Promise<boolean> {
  try {
    const daysUntilExpiration = getDaysUntilExpiration(subscription)
    
    if (!isExpiringSoon(subscription, 7) || daysUntilExpiration > 7) {
      return false // Not time to send notification yet
    }

    // Check if notification was already sent (store in localStorage)
    const notificationKey = `subscription_notification_${subscription.id}_${daysUntilExpiration}`
    if (typeof window !== "undefined") {
      const alreadySent = localStorage.getItem(notificationKey)
      if (alreadySent) {
        return false // Already sent
      }
    }

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: user.email,
        from: "bonusrepairdesk@gmail.com",
        subject: `Your Subscription Expires in ${daysUntilExpiration} Days`,
        html: generateExpiryEmailHTML(user, subscription, daysUntilExpiration),
        text: generateExpiryEmailText(user, subscription, daysUntilExpiration),
      }),
    })

    if (response.ok) {
      // Mark as sent
      if (typeof window !== "undefined") {
        localStorage.setItem(notificationKey, new Date().toISOString())
      }
      return true
    }

    return false
  } catch (error) {
    console.error("Error sending subscription expiry notification:", error)
    return false
  }
}

/**
 * Check and send notifications for all expiring subscriptions
 * Now uses server-side API for proper email sending
 */
export async function checkAndSendExpiryNotifications(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    // Call server-side API to check and send emails
    const response = await fetch("/api/check-subscription-expiry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })

    if (response.ok) {
      const data = await response.json()
      console.log("[SubscriptionNotifications] Checked subscriptions:", data)
    } else {
      console.error("[SubscriptionNotifications] Failed to check subscriptions")
    }
  } catch (error) {
    console.error("Error checking expiry notifications:", error)
  }
}

/**
 * Generate HTML email content for expiry notification
 */
function generateExpiryEmailHTML(
  user: User,
  subscription: Subscription,
  daysUntilExpiration: number
): string {
  // Use calculated end date for free trials to ensure accuracy
  const calculatedEndDate = getSubscriptionEndDate(subscription)
  const endDate = calculatedEndDate.toLocaleDateString()
  const renewalUrl = typeof window !== "undefined" ? `${window.location.origin}/subscription` : "/subscription"

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .info-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Subscription Expiring Soon</h1>
          </div>
          <div class="content">
            <p>Dear ${user.name || user.shopName || "Valued Customer"},</p>
            
            <p>This is a reminder that your subscription will expire in <strong>${daysUntilExpiration} days</strong>.</p>
            
            <div class="info-box">
              <p><strong>Subscription Details:</strong></p>
              <ul>
                <li>Plan: ${subscription.plan}</li>
                <li>Expiry Date: ${endDate}</li>
              </ul>
            </div>
            
            <p>To continue enjoying uninterrupted service, please renew your subscription before it expires.</p>
            
            <p style="text-align: center;">
              <a href="${renewalUrl}" class="button">Renew Subscription Now</a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Best regards,<br>Admin Panel Team</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Generate plain text email content for expiry notification
 */
function generateExpiryEmailText(
  user: User,
  subscription: Subscription,
  daysUntilExpiration: number
): string {
  // Use calculated end date for free trials to ensure accuracy
  const calculatedEndDate = getSubscriptionEndDate(subscription)
  const endDate = calculatedEndDate.toLocaleDateString()
  const renewalUrl = typeof window !== "undefined" ? `${window.location.origin}/subscription` : "/subscription"

  return `
Subscription Expiring Soon

Dear ${user.name || user.shopName || "Valued Customer"},

This is a reminder that your subscription will expire in ${daysUntilExpiration} days.

Subscription Details:
- Plan: ${subscription.plan}
- Expiry Date: ${endDate}

To continue enjoying uninterrupted service, please renew your subscription before it expires.

Renew your subscription here: ${renewalUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Best regards,
Admin Panel Team
  `.trim()
}

/**
 * Schedule daily checks for expiring subscriptions
 */
export function scheduleSubscriptionChecks(): void {
  if (typeof window === "undefined") return

  // Check immediately
  checkAndSendExpiryNotifications()

  // Check every hour (more frequent checks for better reliability)
  setInterval(() => {
    checkAndSendExpiryNotifications()
  }, 60 * 60 * 1000) // 1 hour
}

