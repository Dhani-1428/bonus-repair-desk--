/**
 * MySQL Database Connection
 * Direct MySQL connection without Prisma
 */

import mysql from "mysql2/promise"

/**
 * Convert a Date object or ISO string to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
 * MySQL DATETIME doesn't support timezone or milliseconds
 */
export function toMySQLDateTime(date: Date | string | null | undefined): string | null {
  if (!date) return null
  
  let dateObj: Date
  if (typeof date === "string") {
    // Remove timezone info and parse
    const cleaned = date.replace(/Z$/, "").replace(/\.\d{3}$/, "")
    dateObj = new Date(cleaned)
  } else {
    dateObj = date
  }
  
  if (isNaN(dateObj.getTime())) {
    throw new Error(`Invalid date: ${date}`)
  }
  
  // Format as YYYY-MM-DD HH:MM:SS
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, "0")
  const day = String(dateObj.getDate()).padStart(2, "0")
  const hours = String(dateObj.getHours()).padStart(2, "0")
  const minutes = String(dateObj.getMinutes()).padStart(2, "0")
  const seconds = String(dateObj.getSeconds()).padStart(2, "0")
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Connection pool configuration
const getSSLConfig = () => {
  // For Aiven or any cloud database requiring SSL
  if (process.env.DB_SSL === "true" || process.env.DB_HOST?.includes("aivencloud.com") || process.env.DB_HOST?.includes("cloud")) {
    return {
      rejectUnauthorized: false, // Aiven uses self-signed certificates
    }
  }
  return undefined
}

// Log connection config (without password) for debugging
const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ? "***" : "NOT SET",
  database: process.env.DB_NAME || "admin_panel_db",
  ssl: getSSLConfig(),
}

console.log("[MySQL] Connection config:", {
  host: connectionConfig.host,
  port: connectionConfig.port,
  user: connectionConfig.user,
  password: connectionConfig.password,
  database: connectionConfig.database,
  ssl: connectionConfig.ssl ? "enabled" : "disabled",
  DB_SSL: process.env.DB_SSL,
})

// Validate required environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error("[MySQL] ⚠️  Missing required environment variables:")
  console.error("   DB_HOST:", process.env.DB_HOST ? "✓" : "✗ MISSING")
  console.error("   DB_PORT:", process.env.DB_PORT ? "✓" : "✗ MISSING (using default 3306)")
  console.error("   DB_USER:", process.env.DB_USER ? "✓" : "✗ MISSING")
  console.error("   DB_PASSWORD:", process.env.DB_PASSWORD ? "✓" : "✗ MISSING")
  console.error("   DB_NAME:", process.env.DB_NAME ? "✓" : "✗ MISSING")
}

// Connection pool configuration - increased limit to handle high concurrency
// Most MySQL servers have a default max_connections of 151
// Set to 50 by default, can be increased via DB_CONNECTION_LIMIT environment variable
// For unlimited-like behavior, set DB_CONNECTION_LIMIT to a high value (e.g., 100)
const connectionLimit = parseInt(process.env.DB_CONNECTION_LIMIT || "50")
const queueLimit = parseInt(process.env.DB_QUEUE_LIMIT || "100")

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "admin_panel_db",
  ssl: getSSLConfig(),
  waitForConnections: true,
  connectionLimit: connectionLimit, // Increased to 50 to handle high concurrency
  queueLimit: queueLimit, // Increased queue limit to 100
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 60000, // 60 seconds to allow for slower connections
  // Additional options for better connection stability
  multipleStatements: false,
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  // Connection pool options to prevent leaks
  acquireTimeout: 60000, // Wait up to 60s for a connection from pool
  timeout: 60000, // Connection timeout
  // Auto-reconnect options
  reconnect: true,
})

console.log(`[MySQL] Connection pool configured: limit=${connectionLimit}, queueLimit=${queueLimit}`)

/**
 * Get connection pool statistics
 */
function getPoolStats() {
  const poolState = pool as any
  return {
    totalConnections: poolState._allConnections?.length || 0,
    freeConnections: poolState._freeConnections?.length || 0,
    connectionLimit: connectionLimit,
    queueLength: poolState._connectionQueue?.length || 0,
    queueLimit: queueLimit,
  }
}

/**
 * Log connection pool status (useful for debugging)
 */
function logPoolStatus() {
  const stats = getPoolStats()
  console.log("[MySQL] Pool Status:", {
    active: stats.totalConnections - stats.freeConnections,
    free: stats.freeConnections,
    total: stats.totalConnections,
    limit: stats.connectionLimit,
    queue: stats.queueLength,
    utilization: `${Math.round(((stats.totalConnections - stats.freeConnections) / stats.connectionLimit) * 100)}%`
  })
}

// Handle pool errors and monitor connection usage
pool.on("connection", (connection) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[MySQL] New connection established (pool limit: ${connectionLimit})`)
  }
  
  connection.on("error", (err: any) => {
    console.error("[MySQL] Connection error:", err?.code || err?.message)
    if (err.code === "PROTOCOL_CONNECTION_LOST" || err.code === "ECONNRESET") {
      console.log("[MySQL] Connection lost, will be reconnected automatically")
    }
  })
})

pool.on("error", (err: any) => {
  console.error("[MySQL] Pool error:", err?.code || err?.message)
  if (err.code === "ER_CON_COUNT_ERROR" || err.errno === 1040) {
    const stats = getPoolStats()
    console.error(`[MySQL] ⚠️  Too many connections! Pool limit: ${connectionLimit}`)
    console.error(`[MySQL] Current pool stats:`, stats)
    console.error(`[MySQL] To increase limit, set DB_CONNECTION_LIMIT environment variable (current: ${connectionLimit})`)
    console.error(`[MySQL] To check MySQL server limit, run: SHOW VARIABLES LIKE 'max_connections';`)
  }
})

// Log pool status periodically in development mode
if (process.env.NODE_ENV === "development") {
  setInterval(() => {
    logPoolStatus()
  }, 60000) // Every 60 seconds
}

/**
 * Execute a query with retry logic for connection errors
 * Note: For table/column names, use escapeId() before passing to query
 */
export async function query(sql: string, params?: any[], retries = 2): Promise<any> {
  // Check if required env vars are set before attempting query (only log once per session)
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    const missing = []
    if (!process.env.DB_HOST) missing.push("DB_HOST")
    if (!process.env.DB_USER) missing.push("DB_USER")
    if (!process.env.DB_PASSWORD) missing.push("DB_PASSWORD")
    if (!process.env.DB_NAME) missing.push("DB_NAME")
    
    console.error("[MySQL] ❌ Missing environment variables:", missing)
    
    const error = new Error(`Missing required database environment variables: ${missing.join(", ")}. Please configure them in Vercel project settings and redeploy.`)
    ;(error as any).code = "ENV_MISSING"
    ;(error as any).missing = missing
    throw error
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Use pool.execute which automatically handles connection lifecycle
      const [results] = await pool.execute(sql, params || [])
      // Log successful query only in development mode and for non-SELECT queries
      if (process.env.NODE_ENV === "development" && !sql.trim().toUpperCase().startsWith("SELECT")) {
        console.log(`[MySQL] Query executed successfully (${sql.substring(0, 50)}...)`)
      }
      return results
    } catch (error: any) {
      const isConnectionError = 
        error?.code === "ENOTFOUND" ||
        error?.code === "ECONNRESET" ||
        error?.code === "ETIMEDOUT" ||
        error?.code === "ECONNREFUSED" ||
        error?.code === "PROTOCOL_CONNECTION_LOST" ||
        error?.code === "PROTOCOL_ENQUEUE_AFTER_QUIT" ||
        error?.code === "ER_ACCESS_DENIED_ERROR" ||
        error?.code === "ER_BAD_DB_ERROR" ||
        error?.code === "ER_CON_COUNT_ERROR" ||
        error?.errno === 1040 || // Too many connections
        error?.message?.includes("ENOTFOUND") ||
        error?.message?.includes("getaddrinfo") ||
        error?.message?.includes("Connection lost") ||
        error?.message?.includes("read ECONNRESET") ||
        error?.message?.includes("connect ECONNREFUSED") ||
        error?.message?.includes("Too many connections") ||
        error?.message?.includes("too many connections")
      
      if (isConnectionError && attempt < retries) {
        const isTooManyConnections = error?.code === "ER_CON_COUNT_ERROR" || error?.errno === 1040 || 
                                     error?.message?.includes("Too many connections") || 
                                     error?.message?.includes("too many connections")
        
        console.warn(`[MySQL] Connection error (attempt ${attempt + 1}/${retries + 1}), retrying...`, error?.code || error?.message)
        
        // For "too many connections", use longer backoff to allow connections to free up
        const backoffDelay = isTooManyConnections 
          ? Math.min(Math.pow(2, attempt) * 2000, 10000) // 2s, 4s, 8s, max 10s
          : Math.pow(2, attempt) * 1000 // Standard exponential backoff
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay))
        continue
      }
      
      // Log detailed error information
      console.error("[MySQL] Query error:", {
        code: error?.code,
        errno: error?.errno,
        sqlState: error?.sqlState,
        sqlMessage: error?.sqlMessage,
        message: error?.message,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
      })
      
      throw error
    }
  }
  throw new Error("Query failed after retries")
}

/**
 * Execute a query and return first result
 */
export async function queryOne(sql: string, params?: any[], retries = 2): Promise<any> {
  const results = await query(sql, params, retries)
  return Array.isArray(results) && results.length > 0 ? results[0] : null
}

/**
 * Execute an insert/update/delete query
 */
export async function execute(sql: string, params?: any[], retries = 2): Promise<any> {
  return query(sql, params, retries)
}

/**
 * Get a connection from the pool
 * IMPORTANT: Always release the connection when done using connection.release()
 */
export async function getConnection() {
  const connection = await pool.getConnection()
  // Add automatic release on error to prevent leaks
  const originalRelease = connection.release.bind(connection)
  let released = false
  
  connection.release = function() {
    if (!released) {
      released = true
      return originalRelease()
    }
  }
  
  // Auto-release on connection error
  connection.on('error', (err: any) => {
    if (!released) {
      console.error("[MySQL] Connection error, releasing connection:", err?.message)
      released = true
      originalRelease()
    }
  })
  
  return connection
}

/**
 * Begin a transaction
 */
export async function beginTransaction() {
  const connection = await pool.getConnection()
  await connection.beginTransaction()
  return connection
}

/**
 * Commit a transaction
 */
export async function commit(connection: mysql.PoolConnection) {
  await connection.commit()
  connection.release()
}

/**
 * Rollback a transaction
 */
export async function rollback(connection: mysql.PoolConnection) {
  await connection.rollback()
  connection.release()
}

/**
 * Escape a value for SQL
 */
export function escape(value: any): string {
  return mysql.escape(value)
}

/**
 * Escape an identifier (table/column name)
 */
export function escapeId(value: string): string {
  return mysql.escapeId(value)
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query("SELECT 1")
    return true
  } catch (error) {
    console.error("[MySQL] Connection test failed:", error)
    return false
  }
}

/**
 * Get connection pool statistics (exported for external use)
 */
export function getPoolStats() {
  const poolState = pool as any
  return {
    totalConnections: poolState._allConnections?.length || 0,
    freeConnections: poolState._freeConnections?.length || 0,
    connectionLimit: connectionLimit,
    queueLength: poolState._connectionQueue?.length || 0,
    queueLimit: queueLimit,
  }
}

/**
 * Log connection pool status (exported for external use)
 */
export function logPoolStatus() {
  const stats = getPoolStats()
  console.log("[MySQL] Pool Status:", {
    active: stats.totalConnections - stats.freeConnections,
    free: stats.freeConnections,
    total: stats.totalConnections,
    limit: stats.connectionLimit,
    queue: stats.queueLength,
    utilization: `${Math.round(((stats.totalConnections - stats.freeConnections) / stats.connectionLimit) * 100)}%`
  })
}

/**
 * Close all connections
 */
export async function closePool() {
  await pool.end()
}

export default pool

