import { NextRequest, NextResponse } from "next/server"
import { query, queryOne, execute } from "@/lib/mysql"
import { v4 as uuidv4 } from "uuid"

// GET subscription history for a user
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

    const history = await query(
      `SELECT * FROM subscription_history WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    )

    return NextResponse.json({ history })
  } catch (error) {
    console.error("[API] Error fetching subscription history:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription history" },
      { status: 500 }
    )
  }
}

// POST save subscription to history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      subscriptionId,
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

    // Check if already in history (by subscriptionId if provided)
    if (subscriptionId) {
      const existing = await queryOne(
        `SELECT * FROM subscription_history WHERE userId = ? AND id = ?`,
        [userId, subscriptionId]
      )
      
      if (existing) {
        return NextResponse.json({ message: "Already in history", history: existing })
      }
    }

    // Convert dates to MySQL format
    const toMySQLDateTime = (dateStr: string) => {
      if (!dateStr) return null
      const date = new Date(dateStr)
      return date.toISOString().slice(0, 19).replace('T', ' ')
    }

    const historyId = subscriptionId || uuidv4()
    const historyStartDate = toMySQLDateTime(startDate)
    const historyEndDate = toMySQLDateTime(endDate)

    // Save to history
    await execute(
      `INSERT INTO subscription_history 
       (id, userId, tenantId, plan, status, startDate, endDate, price, paymentStatus, paymentId, isFreeTrial)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        historyId,
        userId,
        user.tenantId,
        plan,
        status || "EXPIRED",
        historyStartDate,
        historyEndDate,
        price || null,
        paymentStatus || null,
        paymentId || null,
        isFreeTrial || false,
      ]
    )

    const savedHistory = await queryOne(
      `SELECT * FROM subscription_history WHERE id = ?`,
      [historyId]
    )

    return NextResponse.json({ message: "Saved to history", history: savedHistory }, { status: 201 })
  } catch (error) {
    console.error("[API] Error saving subscription history:", error)
    return NextResponse.json(
      { error: "Failed to save subscription history" },
      { status: 500 }
    )
  }
}
