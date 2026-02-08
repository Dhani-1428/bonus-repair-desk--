import { NextRequest, NextResponse } from "next/server"
import { query, queryOne } from "@/lib/mysql"
import bcrypt from "bcryptjs"
import { sendLoginEmail, sendAdminLoginNotification } from "@/lib/email-service"

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error("[API] Failed to parse request body:", parseError?.message || parseError)
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      )
    }

    const { email, password } = body || {}

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    console.log("[API] Login attempt for email:", email)

    // Find user (case-insensitive email comparison) with retry on connection errors
    let user
    const maxRetries = 3
    let lastError: any = null
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        user = await queryOne(
          `SELECT * FROM users WHERE LOWER(email) = LOWER(?)`,
          [email.trim()]
        )
        // Success - break out of retry loop
        break
      } catch (dbError: any) {
        lastError = dbError
        
        // Check if it's a connection-related error that we should retry
        const isConnectionError = 
          dbError?.code === "ER_CON_COUNT_ERROR" || 
          dbError?.errno === 1040 || 
          dbError?.code === "ECONNRESET" ||
          dbError?.code === "ETIMEDOUT" ||
          dbError?.code === "ECONNREFUSED" ||
          dbError?.code === "PROTOCOL_CONNECTION_LOST" ||
          dbError?.message?.includes("Too many connections") ||
          dbError?.message?.includes("too many connections") ||
          dbError?.message?.includes("ECONNRESET") ||
          dbError?.message?.includes("Connection lost") ||
          dbError?.message?.includes("read ECONNRESET")
        
        // If it's a connection error and we have retries left, retry with exponential backoff
        if (isConnectionError && attempt < maxRetries) {
          const isTooManyConnections = dbError?.code === "ER_CON_COUNT_ERROR" || 
                                       dbError?.errno === 1040 || 
                                       dbError?.message?.includes("Too many connections") ||
                                       dbError?.message?.includes("too many connections")
          
          // Use longer backoff for "too many connections" errors
          const backoffDelay = isTooManyConnections 
            ? Math.min(Math.pow(2, attempt) * 2000, 10000) // 2s, 4s, 8s, max 10s
            : Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
          
          console.warn(`[API] Database connection error (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffDelay}ms...`, {
            code: dbError?.code,
            errno: dbError?.errno,
            message: dbError?.message,
          })
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          continue // Retry
        }
        
        // Handle DNS resolution errors (ENOTFOUND) - don't retry these
        if (dbError?.code === "ENOTFOUND" || dbError?.message?.includes("ENOTFOUND") || dbError?.message?.includes("getaddrinfo")) {
          console.error("[API] Database hostname cannot be resolved:", {
            code: dbError?.code,
            message: dbError?.message,
            host: process.env.DB_HOST,
          })
          throw new Error("Database connection failed: Cannot resolve database hostname. Please check your database configuration.")
        }
        
        // If we've exhausted retries or it's not a connection error, throw
        if (attempt === maxRetries) {
          if (isConnectionError) {
            throw new Error("Database is temporarily busy. Please try again in a moment.")
          }
          throw dbError
        }
      }
    }
    
    // If we still don't have a user after all retries, throw the last error
    if (!user && lastError) {
      if (lastError?.code === "ER_CON_COUNT_ERROR" || 
          lastError?.errno === 1040 || 
          lastError?.message?.includes("Too many connections") ||
          lastError?.message?.includes("too many connections")) {
        throw new Error("Database is temporarily busy. Please try again in a moment.")
      }
      throw lastError
    }

    if (!user) {
      console.error("[API] User not found for email:", email)
      // Check if any users exist
      const allUsers = await query(`SELECT email FROM users LIMIT 5`)
      console.log("[API] Available users (first 5):", allUsers)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
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
        { status: 401 }
      )
    }

    // Track login history (non-blocking)
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

    // Return user data (password excluded)
    const { password: _, ...userWithoutPassword } = user

    console.log("[API] Login successful for:", email, "Role:", user.role)

    // Send login emails (non-blocking) - wrapped in separate try-catch to not block login
    // Use setTimeout to make it truly non-blocking
    setTimeout(async () => {
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
        
        console.log("[API] Sending login emails for user:", user.email)
        
        // Send email to user
        try {
          const userEmailResult = await sendLoginEmail(userForEmail)
          console.log("[API] User login email sent:", userEmailResult ? "Success" : "Failed")
        } catch (userEmailError: any) {
          console.error("[API] Error sending user login email:", userEmailError?.message || userEmailError)
        }
        
        // Send notification to admin (skip for super admin)
        if (user.role !== "SUPER_ADMIN" && user.role !== "super_admin") {
          try {
            const adminEmailResult = await sendAdminLoginNotification(userForEmail)
            console.log("[API] Admin login notification sent:", adminEmailResult ? "Success" : "Failed")
          } catch (adminEmailError: any) {
            console.error("[API] Error sending admin login notification:", adminEmailError?.message || adminEmailError)
          }
        } else {
          console.log("[API] Skipping admin login notification for super admin")
        }
      } catch (emailError: any) {
        console.error("[API] Error in login email sending block:", emailError?.message || emailError)
        // Don't fail login if email fails
      }
    }, 0)

    return NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
    })
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
        { status: 500 }
      )
    } catch (jsonError) {
      // If JSON serialization fails, return a simple text response
      return new NextResponse(
        JSON.stringify({ error: errorMessage }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }
  }
}
