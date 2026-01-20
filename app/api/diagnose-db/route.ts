import { NextRequest, NextResponse } from "next/server"

/**
 * Comprehensive database configuration diagnostic endpoint
 * Shows exactly what's configured and what needs to be fixed
 */
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || "not set",
      VERCEL: process.env.VERCEL || "not detected",
      VERCEL_ENV: process.env.VERCEL_ENV || "not detected",
    },
    database: {
      required: {
        DB_HOST: {
          status: process.env.DB_HOST ? "✓ SET" : "✗ MISSING",
          value: process.env.DB_HOST || "NOT SET",
          expected: "mysql-2d150b00-dhani.d.aivencloud.com (or your Aiven hostname)",
        },
        DB_PORT: {
          status: process.env.DB_PORT ? "✓ SET" : "✗ MISSING",
          value: process.env.DB_PORT || "NOT SET",
          expected: "21649 (or your Aiven port)",
        },
        DB_USER: {
          status: process.env.DB_USER ? "✓ SET" : "✗ MISSING",
          value: process.env.DB_USER || "NOT SET",
          expected: "avnadmin",
        },
        DB_PASSWORD: {
          status: process.env.DB_PASSWORD ? "✓ SET" : "✗ MISSING",
          value: "***" + (process.env.DB_PASSWORD ? " (hidden)" : " NOT SET"),
          expected: "Your Aiven database password",
        },
        DB_NAME: {
          status: process.env.DB_NAME ? "✓ SET" : "✗ MISSING",
          value: process.env.DB_NAME || "NOT SET",
          expected: "defaultdb (or your database name)",
        },
        DB_SSL: {
          status: process.env.DB_SSL ? "✓ SET" : "⚠️  MISSING (will auto-detect)",
          value: process.env.DB_SSL || "NOT SET (defaults to auto-detect)",
          expected: "true",
        },
      },
    },
    fixInstructions: {
      ifOnVercel: {
        step1: "Go to https://vercel.com/dashboard",
        step2: "Select your project → Settings → Environment Variables",
        step3: "Add these variables (exact names, uppercase):",
        variables: [
          "DB_HOST = mysql-2d150b00-dhani.d.aivencloud.com",
          "DB_PORT = 21649",
          "DB_USER = avnadmin",
          "DB_PASSWORD = (your Aiven password)",
          "DB_NAME = defaultdb",
          "DB_SSL = true",
        ],
        step4: "For each variable, select 'Production' environment",
        step5: "Go to Deployments → Click 'Redeploy' on latest deployment",
        step6: "Wait for deployment to complete, then test again",
      },
      ifLocal: {
        step1: "Create a .env file in the project root",
        step2: "Add these lines:",
        example: `DB_HOST=mysql-2d150b00-dhani.d.aivencloud.com
DB_PORT=21649
DB_USER=avnadmin
DB_PASSWORD=your-actual-password
DB_NAME=defaultdb
DB_SSL=true`,
        step3: "Restart your dev server: npm run dev",
      },
      verifyAiven: {
        step1: "Go to https://console.aiven.io/",
        step2: "Log in and select your MySQL service",
        step3: "Go to 'Overview' tab → 'Connection information'",
        step4: "Verify the hostname and port match your environment variables",
        step5: "If hostname has changed, update DB_HOST in Vercel/local .env",
      },
    },
    allEnvVars: Object.keys(process.env)
      .filter(k => k.startsWith("DB_"))
      .reduce((acc, k) => {
        acc[k] = k === "DB_PASSWORD" ? "*** (hidden)" : process.env[k]
        return acc
      }, {} as Record<string, string>),
  }

  // Check if all required variables are set
  const missing = []
  if (!process.env.DB_HOST) missing.push("DB_HOST")
  if (!process.env.DB_PORT) missing.push("DB_PORT")
  if (!process.env.DB_USER) missing.push("DB_USER")
  if (!process.env.DB_PASSWORD) missing.push("DB_PASSWORD")
  if (!process.env.DB_NAME) missing.push("DB_NAME")

  diagnostics.status = missing.length === 0 ? "✓ All variables set" : `✗ Missing ${missing.length} variable(s)`
  diagnostics.missing = missing

  return NextResponse.json(diagnostics, {
    status: missing.length === 0 ? 200 : 500,
  })
}
