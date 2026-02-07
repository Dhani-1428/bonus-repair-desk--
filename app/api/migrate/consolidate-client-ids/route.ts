import { NextRequest, NextResponse } from "next/server"
import { query, execute, escapeId } from "@/lib/mysql"
import { getTenantTableNames, tenantTablesExist } from "@/lib/tenant-db"

// Migration endpoint to ensure one client has only one client ID
// Consolidates all tickets for the same customer name to use the same client ID
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

    // Get all tickets with customer names and client IDs
    const allTickets = await query(
      `SELECT id, customerName, clientId, createdAt FROM ${tableName} 
       WHERE customerName IS NOT NULL AND customerName != '' 
       ORDER BY createdAt ASC`
    ) as any[]

    if (!allTickets || allTickets.length === 0) {
      return NextResponse.json(
        { message: "No tickets found to migrate", migrated: 0, consolidated: 0 },
        { status: 200 }
      )
    }

    // Group tickets by customer name (case-insensitive, trimmed)
    const customerGroups = new Map<string, any[]>()
    
    allTickets.forEach((ticket: any) => {
      if (!ticket.customerName) return
      
      const normalizedName = ticket.customerName.trim().toLowerCase()
      if (!customerGroups.has(normalizedName)) {
        customerGroups.set(normalizedName, [])
      }
      customerGroups.get(normalizedName)!.push(ticket)
    })

    let consolidatedCount = 0
    let updatedCount = 0
    const consolidationDetails: any[] = []

    // For each customer group, determine the canonical client ID and update all tickets
    for (const [normalizedName, tickets] of customerGroups.entries()) {
      if (tickets.length <= 1) continue // Skip if only one ticket

      // Find the canonical client ID (prefer the oldest valid client ID)
      let canonicalClientId: string | null = null
      
      // First, try to find a valid CLI- format client ID from the oldest ticket
      const sortedTickets = tickets.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateA - dateB
      })

      for (const ticket of sortedTickets) {
        if (ticket.clientId && typeof ticket.clientId === 'string') {
          // Check if it's a valid CLI- format
          const match = ticket.clientId.match(/^CLI-(\d{1,4})$/i)
          if (match) {
            canonicalClientId = ticket.clientId.toUpperCase()
            break
          }
        }
      }

      // If no valid CLI- format found, use the most common client ID
      if (!canonicalClientId) {
        const clientIdCounts = new Map<string, number>()
        tickets.forEach((ticket: any) => {
          if (ticket.clientId) {
            const count = clientIdCounts.get(ticket.clientId) || 0
            clientIdCounts.set(ticket.clientId, count + 1)
          }
        })
        
        let maxCount = 0
        for (const [cid, count] of clientIdCounts.entries()) {
          if (count > maxCount) {
            maxCount = count
            canonicalClientId = cid
          }
        }
      }

      // If still no client ID found, use the oldest ticket's client ID (even if null/empty)
      if (!canonicalClientId && sortedTickets.length > 0) {
        canonicalClientId = sortedTickets[0].clientId || null
      }

      // Update all tickets for this customer to use the canonical client ID
      if (canonicalClientId) {
        const ticketsToUpdate = tickets.filter((t: any) => 
          !t.clientId || t.clientId !== canonicalClientId
        )

        for (const ticket of ticketsToUpdate) {
          try {
            await execute(
              `UPDATE ${tableName} SET clientId = ? WHERE id = ?`,
              [canonicalClientId, ticket.id]
            )
            updatedCount++
          } catch (error: any) {
            console.error(`[Migration] Error updating ticket ${ticket.id}:`, error)
          }
        }

        if (ticketsToUpdate.length > 0) {
          consolidatedCount++
          consolidationDetails.push({
            customerName: tickets[0].customerName,
            canonicalClientId,
            ticketsUpdated: ticketsToUpdate.length,
            totalTickets: tickets.length
          })
        }
      }
    }

    return NextResponse.json(
      {
        message: `Successfully consolidated client IDs. ${consolidatedCount} customers consolidated, ${updatedCount} tickets updated.`,
        consolidated: consolidatedCount,
        updated: updatedCount,
        totalCustomers: customerGroups.size,
        details: consolidationDetails
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
