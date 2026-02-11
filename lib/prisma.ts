import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Construct DATABASE_URL from individual DB_* variables if DATABASE_URL is not set
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Build from individual variables
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "3306";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "admin_panel_db";
  const ssl = process.env.DB_SSL === "true" ? "?sslaccept=strict" : "";
  
  return `mysql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}${ssl}`;
};

// Configure Prisma with connection pool limits to prevent "too many connections" errors
// Prisma uses connection pooling, so we need to limit it
const getDatabaseUrlWithPool = () => {
  const baseUrl = getDatabaseUrl()
  // Add connection pool parameters to the URL
  // Prisma connection pool settings (max 5 connections to match MySQL pool)
  const poolSize = process.env.PRISMA_CONNECTION_LIMIT || "5"
  const connectionTimeout = process.env.PRISMA_CONNECTION_TIMEOUT || "30"
  
  // Parse URL and add connection_limit parameter
  try {
    const url = new URL(baseUrl)
    url.searchParams.set("connection_limit", poolSize)
    url.searchParams.set("connect_timeout", connectionTimeout)
    url.searchParams.set("pool_timeout", connectionTimeout)
    return url.toString()
  } catch {
    // If URL parsing fails, append parameters manually
    const separator = baseUrl.includes("?") ? "&" : "?"
    return `${baseUrl}${separator}connection_limit=${poolSize}&connect_timeout=${connectionTimeout}&pool_timeout=${connectionTimeout}`
  }
}

// Set DATABASE_URL before PrismaClient initialization to ensure connection pool limits are applied
// This must be done before creating PrismaClient as it reads DATABASE_URL at initialization
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = getDatabaseUrlWithPool()
} else {
  // If DATABASE_URL is already set, ensure it has connection pool parameters
  const existingUrl = process.env.DATABASE_URL
  if (!existingUrl.includes("connection_limit")) {
    // Add connection_limit if not present
    const poolSize = process.env.PRISMA_CONNECTION_LIMIT || "5"
    const separator = existingUrl.includes("?") ? "&" : "?"
    process.env.DATABASE_URL = `${existingUrl}${separator}connection_limit=${poolSize}`
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
