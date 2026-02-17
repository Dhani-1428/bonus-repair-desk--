import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/mysql"
import bcrypt from "bcryptjs"
import { sendLoginEmail, sendAdminLoginNotification } from "@/lib/email-service"

// CORS headers helper
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET() {
  // Simple GET handler for testing connectivity
  return NextResponse.json(
    { 
      message: "Login endpoint is accessible",
      method: "Use POST to login",
      endpoint: "/api/auth/login",
      requiredFields: ["email", "password"]
    },
    { headers: corsHeaders() }
  )
}

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error("[API] Failed to parse request body:", parseError?.message || parseError)
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400, headers: corsHeaders() }
      )
    }

    const { email, password } = body || {}

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders() }
      )
    }

    console.log("[API] Login attempt for email:", email)

    // Find user (case-insensitive email comparison) - optimized for speed
    let user
    try {
      // Use queryOne with built-in retry logic (default 2 retries)
      // This will automatically retry on connection errors with exponential backoff
      user = await queryOne(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`,
        [email.trim()],
        3 // 3 retries total (initial + 3 retries = 4 attempts)
      )
    } catch (dbError: any) {
      // Log the error for debugging
      console.error("[API] Database error during login:", {
        code: dbError?.code,
        errno: dbError?.errno,
        message: dbError?.message,
        sqlState: dbError?.sqlState,
      })
      
      // Handle specific database errors
      if (dbError?.code === "ENOTFOUND" || dbError?.message?.includes("ENOTFOUND") || dbError?.message?.includes("getaddrinfo")) {
        console.error("[API] Database hostname cannot be resolved:", {
          code: dbError?.code,
          message: dbError?.message,
          host: process.env.DB_HOST,
        })
        throw new Error("Database connection failed: Cannot resolve database hostname. Please check your database configuration.")
      } else if (dbError?.code === "ER_CON_COUNT_ERROR" || dbError?.errno === 1040 || 
                 dbError?.message?.includes("Too many connections") || 
                 dbError?.message?.includes("too many connections")) {
        // Connection pool exhausted - provide helpful message
        console.error("[API] Database connection pool exhausted")
        throw new Error("Database is temporarily busy with too many connections. Please wait a moment and try again.")
      } else if (dbError?.code === "ECONNREFUSED" || dbError?.code === "ETIMEDOUT" || 
                 dbError?.code === "ECONNRESET" || dbError?.code === "PROTOCOL_CONNECTION_LOST") {
        // Connection refused or timed out
        console.error("[API] Database connection failed:", dbError?.code)
        throw new Error("Database connection failed. Please check your database server and try again.")
      } else {
        // Re-throw other errors
        throw dbError
      }
    }

    if (!user) {
      console.error("[API] User not found for email:", email)
      // Check if any users exist
      const allUsers = await query(`SELECT email FROM users LIMIT 5`)
      console.log("[API] Available users (first 5):", allUsers)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: corsHeaders() }
      )
    }

    console.log("[API] User found:", { id: user.id, email: user.email, role: user.role })

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.error("[API] Invalid password for user:", email)
      console.error("[API] Password hash in DB:", user.password?.substring(0, 20) + "...")
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401, headers: corsHeaders() }
      )
    }

    // Track login history (truly non-blocking - fire and forget)
    Promise.resolve().then(async () => {
      try {
        const loginId = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        await query(
          `INSERT INTO login_history (id, userId, tenantId, ip) VALUES (?, ?, ?, ?)`,
          [
            loginId,
            user.id,
            user.tenantId,
            request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
          ]
        )
      } catch (historyError) {
        console.error("[API] Failed to log login history (non-critical):", historyError)
        // Continue with login even if history logging fails
      }
    }).catch(() => {}) // Silently fail

    // Return user data (password excluded)
    const { password: _, ...userWithoutPassword } = user

    console.log("[API] Login successful for:", email, "Role:", user.role)

    // Send login emails (truly non-blocking - fire and forget)
    Promise.resolve().then(async () => {
      try {
        const userForEmail = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          shopName: user.shopName || null,
          contactNumber: user.contactNumber || null,
          tenantId: user.tenantId,
          createdAt: user.createdAt || new Date().toISOString(),
        }
        
        // Send email to user (their email address) - FROM bonusrepairdesk@gmail.com
        console.log("[API] Sending login email to user:", userForEmail.email)
        const userEmailResult = await sendLoginEmail(userForEmail).catch((err) => {
          console.error("[API] ❌ Error sending user login email:", err?.message || err)
          return false
        })
        if (userEmailResult) {
          console.log("[API] ✅ User login email sent successfully to:", userForEmail.email)
        } else {
          console.error("[API] ❌ Failed to send user login email to:", userForEmail.email)
        }
        
        // Send notification to admin at bonusrepairdesk@gmail.com (skip for super admin)
        if (user.role !== "SUPER_ADMIN" && user.role !== "super_admin") {
          console.log("[API] Sending admin login notification to bonusrepairdesk@gmail.com for user:", userForEmail.email)
          const adminEmailResult = await sendAdminLoginNotification(userForEmail).catch((err) => {
            console.error("[API] ❌ Error sending admin login notification:", err?.message || err)
            return false
          })
          if (adminEmailResult) {
            console.log("[API] ✅ Admin login notification sent successfully to bonusrepairdesk@gmail.com")
          } else {
            console.error("[API] ❌ Failed to send admin login notification to bonusrepairdesk@gmail.com")
          }
        } else {
          console.log("[API] Skipping admin login notification (super admin)")
        }
      } catch (emailError: any) {
        console.error("[API] Error in login email sending block:", emailError?.message || emailError)
        // Don't fail login if email fails
      }
    }).catch(() => {}) // Silently fail

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
      token: userWithoutPassword.id, // Use user ID as token for mobile app compatibility
    }, { headers: corsHeaders() })
  } catch (error: any) {
    console.error("[API] Login error:", error)
    console.error("[API] Error details:", {
      message: error?.message || "Unknown error",
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      stack: error?.stack?.substring(0, 500),
    })
    
    // Determine error message with helpful guidance
    let errorMessage = "Internal server error"
    let helpUrl = ""
    
    if (error?.code === "ENOTFOUND" || error?.message?.includes("ENOTFOUND") || error?.message?.includes("getaddrinfo")) {
      errorMessage = `Database connection failed: Cannot resolve database hostname '${process.env.DB_HOST || "unknown"}'. `
      if (process.env.VERCEL) {
        errorMessage += "Please check your database configuration in Vercel environment variables. Visit /api/diagnose-db for detailed setup instructions."
      } else {
        errorMessage += "Please check your .env file. Visit /api/diagnose-db for detailed setup instructions."
      }
      helpUrl = "/api/diagnose-db"
    } else if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
      errorMessage = "Database connection failed. Please try again later or check if your database server is running."
    } else if (error?.code === "ER_ACCESS_DENIED_ERROR") {
      errorMessage = "Database authentication failed. Please verify your database username and password in environment variables."
    } else if (error?.code === "ER_BAD_DB_ERROR") {
      errorMessage = `Database '${process.env.DB_NAME || "unknown"}' not found. Please check your DB_NAME environment variable.`
    } else if (error?.code === "ER_CON_COUNT_ERROR" || error?.errno === 1040 || error?.message?.includes("Too many connections")) {
      errorMessage = "Database is temporarily busy with too many connections. Please wait a moment and try again."
    } else if (error?.code === "ER_NO_SUCH_TABLE") {
      errorMessage = "Database table not found. Please run the database initialization script."
    } else if (error?.code === "ENV_MISSING") {
      const missing = (error as any)?.missing || []
      errorMessage = `Database configuration missing: ${missing.join(", ")}. `
      if (process.env.VERCEL) {
        errorMessage += "Please set these environment variables in Vercel project settings → Environment Variables. Visit /api/diagnose-db for step-by-step instructions."
      } else {
        errorMessage += "Please add these to your .env file. Visit /api/diagnose-db for step-by-step instructions."
      }
      helpUrl = "/api/diagnose-db"
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    // Always return a proper JSON response
    try {
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === "development" ? error?.message : undefined,
          code: process.env.NODE_ENV === "development" ? error?.code : undefined,
          helpUrl: helpUrl || (error?.code === "ENOTFOUND" || error?.code === "ENV_MISSING" ? "/api/diagnose-db" : undefined),
          diagnoseUrl: "/api/diagnose-db",
        },
        { status: 500, headers: corsHeaders() }
      )
    } catch (jsonError) {
      // If JSON serialization fails, return a simple text response
      return new NextResponse(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders() }
        }
      )
    }
  }
}
