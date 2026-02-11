import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/mysql"

// GET all subscriptions with user data
export async function GET(request: NextRequest) {
  try {
    console.log("[API] Fetching all subscriptions from database...")
    const subscriptions = await query(`
      SELECT 
        s.*,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.shopName as user_shopName,
        u.contactNumber as user_contactNumber
      FROM subscriptions s
      LEFT JOIN users u ON s.userId = u.id
      ORDER BY s.createdAt DESC
    `)
    
    console.log("[API] Found subscriptions:", subscriptions.length)

    // Transform results to match expected format
    const formatted = (subscriptions as any[]).map((sub) => ({
      ...sub,
      user: {
        id: sub.user_id,
        name: sub.user_name,
        email: sub.user_email,
        shopName: sub.user_shopName,
        contactNumber: sub.user_contactNumber,
      },
    }))

    return NextResponse.json({ subscriptions: formatted })
  } catch (error: any) {
    console.error("[API] Error fetching all subscriptions:", error)
    console.error("[API] Error details:", {
      code: error?.code,
      errno: error?.errno,
      message: error?.message,
      sqlState: error?.sqlState
    })
    
    // Return empty array instead of error to prevent UI blocking
    if (error?.code === "ER_CON_COUNT_ERROR" || error?.errno === 1040) {
      console.warn("[API] Database busy, returning empty array")
      return NextResponse.json({ subscriptions: [] })
    }
    
    // Return empty array on any error to prevent UI blocking
    return NextResponse.json({ subscriptions: [] })
  }
}
