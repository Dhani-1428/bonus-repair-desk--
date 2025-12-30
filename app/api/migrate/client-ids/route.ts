import { NextRequest, NextResponse } from "next/server"
import { query, execute, escapeId } from "@/lib/mysql"
import { getTenantTableNames, tenantTablesExist } from "@/lib/tenant-db"

// Migration endpoint to convert all client IDs to 4-digit format (CLI-0001, CLI-0002, etc.)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Get user to find tenantId
    const user = await query(
      `SELECT tenantId FROM users WHERE id = ?`,
      [userId]
    ) as any[]

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const tenantId = user[0].tenantId

    // Check if tenant tables exist
    if (!(await tenantTablesExist(tenantId))) {
      return NextResponse.json(
        { error: "Tenant tables do not exist" },
        { status: 404 }
      )
    }

    const tables = getTenantTableNames(tenantId)
    const tableName = escapeId(tables.repairTickets)

    // Get all tickets ordered by creation date (oldest first)
    const allTickets = await query(
      `SELECT id, clientId, createdAt FROM ${tableName} ORDER BY createdAt ASC`
    ) as any[]

    if (!allTickets || allTickets.length === 0) {
      return NextResponse.json(
        { message: "No tickets found to migrate", migrated: 0 },
        { status: 200 }
      )
    }

    let migrationCount = 0
    let sequenceNumber = 1

    // Update each ticket with a new 4-digit client ID
    for (const ticket of allTickets) {
      const newClientId = `CLI-${String(sequenceNumber).padStart(4, "0")}`
      
      try {
        await execute(
          `UPDATE ${tableName} SET clientId = ? WHERE id = ?`,
          [newClientId, ticket.id]
        )
        migrationCount++
        sequenceNumber++
      } catch (error: any) {
        console.error(`[Migration] Error updating ticket ${ticket.id}:`, error)
        // Continue with next ticket even if one fails
      }
    }

    return NextResponse.json(
      {
        message: `Successfully migrated ${migrationCount} client IDs to 4-digit format`,
        migrated: migrationCount,
        total: allTickets.length
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("[Migration] Error:", error)
    return NextResponse.json(
      { error: error.message || "Migration failed" },
      { status: 500 }
    )
  }
}

