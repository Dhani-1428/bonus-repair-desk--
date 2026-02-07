import { NextRequest, NextResponse } from "next/server"
import { query, queryOne, execute, escapeId } from "@/lib/mysql"
import { getTenantTableNames, tenantTablesExist, createTenantTables, migrateTenantTables } from "@/lib/tenant-db"

// GET single repair ticket by ID (tenant-specific)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    // Handle async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params)
    const ticketId = resolvedParams.id

    const tables = getTenantTableNames(user.tenantId)
    const tableName = escapeId(tables.repairTickets)
    const ticket = await queryOne(
      `SELECT * FROM ${tableName} WHERE id = ? LIMIT 1`,
      [ticketId]
    )

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    // Parse JSON fields
    if (ticket.selectedServices && typeof ticket.selectedServices === 'string') {
      try {
        ticket.selectedServices = JSON.parse(ticket.selectedServices)
      } catch (e) {
        console.error("[API] Error parsing selectedServices:", e)
        ticket.selectedServices = []
      }
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("[API] Error fetching repair ticket:", error)
    return NextResponse.json(
      { error: "Failed to fetch repair ticket" },
      { status: 500 }
    )
  }
}

// PUT update repair ticket (tenant-specific)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const body = await request.json()
    const { userId, ...updateData } = body

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    // Get user to find tenantId and name for edit history
    const user = await queryOne(
      `SELECT tenantId, name FROM users WHERE id = ?`,
      [userId]
    )

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Handle async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params)
    const ticketId = resolvedParams.id

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      )
    }

    // Ensure tables exist and are migrated
    const tablesExist = await tenantTablesExist(user.tenantId)
    if (!tablesExist) {
      await createTenantTables(user.tenantId)
    } else {
      // Run migration to ensure all columns exist (including simTray)
      await migrateTenantTables(user.tenantId)
    }

    const tables = getTenantTableNames(user.tenantId)
    const tableName = escapeId(tables.repairTickets)

    // Get original ticket for edit history
    const originalTicket = await queryOne(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [ticketId]
    )

    if (!originalTicket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      )
    }

    // Build update query dynamically
    const updateFields: string[] = []
    const updateValues: any[] = []
    const changes: any = {}

    // Helper function to normalize values for comparison
    const normalizeValue = (val: any): any => {
      if (val === null || val === undefined || val === "") return null
      if (typeof val === "number") return val
      if (typeof val === "boolean") return val
      if (Array.isArray(val)) return JSON.stringify(val.sort())
      if (typeof val === "object") return JSON.stringify(val)
      return String(val).trim()
    }

    // Helper function to check if values are equal
    const valuesEqual = (oldVal: any, newVal: any): boolean => {
      const normalizedOld = normalizeValue(oldVal)
      const normalizedNew = normalizeValue(newVal)
      
      // Handle null/undefined/empty string as equivalent
      if ((normalizedOld === null || normalizedOld === "" || normalizedOld === undefined) &&
          (normalizedNew === null || normalizedNew === "" || normalizedNew === undefined)) {
        return true
      }
      
      return normalizedOld === normalizedNew
    }

    // Check which columns exist in the table
    let existingColumns: Set<string> = new Set()
    try {
      const columns = await query(`SHOW COLUMNS FROM ${tableName}`) as any[]
      existingColumns = new Set(columns.map((col: any) => col.Field))
    } catch (error) {
      console.warn("[API] Could not fetch column list, proceeding with update")
    }

    Object.entries(updateData).forEach(([key, value]) => {
      // Skip userId and other non-database fields
      if (key === "userId" || key === "id") return
      
      // Skip fields that don't exist in the database (e.g., simTray if migration hasn't run yet)
      if (existingColumns.size > 0 && !existingColumns.has(key)) {
        console.warn(`[API] Skipping field ${key} - column does not exist in database`)
        return
      }
      
      const originalValue = originalTicket[key]
      
      // Skip fields that haven't changed (with proper comparison)
      if (valuesEqual(originalValue, value)) return
      
      // Track changes for edit history
      changes[key] = {
        old: originalValue,
        new: value,
        changedAt: new Date().toISOString(),
        changedBy: userId
      }
      
      // Handle different field types
      if (key === "selectedServices" && Array.isArray(value)) {
        updateFields.push(`\`${key}\` = ?`)
        updateValues.push(JSON.stringify(value))
      } else if (value === null || value === undefined || value === "") {
        // Set to NULL for empty values
        updateFields.push(`\`${key}\` = ?`)
        updateValues.push(null)
      } else if (typeof value === "boolean") {
        updateFields.push(`\`${key}\` = ?`)
        updateValues.push(value ? 1 : 0)
      } else if (typeof value === "number") {
        updateFields.push(`\`${key}\` = ?`)
        updateValues.push(value)
      } else {
        updateFields.push(`\`${key}\` = ?`)
        updateValues.push(value)
      }
    })

    // If status is being changed to DELIVERED, set deliveredDate
    if (updateData.status && (updateData.status === "DELIVERED" || updateData.status === "delivered") && 
        (originalTicket.status !== "DELIVERED" && originalTicket.status !== "delivered")) {
      // Check if deliveredDate column exists
      if (existingColumns.size === 0 || existingColumns.has("deliveredDate")) {
        updateFields.push(`\`deliveredDate\` = ?`)
        updateValues.push(new Date().toISOString().slice(0, 19).replace('T', ' '))
      }
    }

    // Get existing edit history
    let editHistory: any[] = []
    if (originalTicket.editHistory) {
      try {
        editHistory = typeof originalTicket.editHistory === 'string' 
          ? JSON.parse(originalTicket.editHistory) 
          : originalTicket.editHistory
        if (!Array.isArray(editHistory)) {
          editHistory = []
        }
      } catch {
        editHistory = []
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      )
    }

    // Check if editHistory column exists before trying to update it
    let editHistoryColumnExists = false
    try {
      await query(`SELECT editHistory FROM ${tableName} LIMIT 1`, [])
      editHistoryColumnExists = true
    } catch (err: any) {
      if (err.code === "ER_BAD_FIELD_ERROR" || err.message?.includes("Unknown column") || err.message?.includes("editHistory")) {
        editHistoryColumnExists = false
        console.log("[API] editHistory column doesn't exist yet, will be added by migration")
      } else {
        // If it's a different error, log it but don't fail
        console.warn("[API] Error checking editHistory column:", err.message)
        editHistoryColumnExists = false
      }
    }

    // Add new edit record if there are changes and column exists
    if (Object.keys(changes).length > 0 && editHistoryColumnExists) {
      editHistory.push({
        changes,
        editedAt: new Date().toISOString(),
        editedBy: userId,
        editedByName: user.name || "Unknown"
      })
      
      updateFields.push(`\`editHistory\` = ?`)
      updateValues.push(JSON.stringify(editHistory))
    }

    updateValues.push(ticketId)

    try {
      await execute(
        `UPDATE ${tableName} SET ${updateFields.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        updateValues
      )
    } catch (updateError: any) {
      console.error("[API] Update error:", {
        code: updateError.code,
        message: updateError.message,
        sqlState: updateError.sqlState,
        sqlMessage: updateError.sqlMessage
      })
      
      // If editHistory column doesn't exist, try again without it
      if (updateError.code === "ER_BAD_FIELD_ERROR" && updateError.message?.includes("editHistory")) {
        console.log("[API] editHistory column doesn't exist, retrying without it")
        const historyIndex = updateFields.findIndex(f => f.includes("editHistory"))
        if (historyIndex !== -1) {
          updateFields.splice(historyIndex, 1)
          updateValues.splice(historyIndex, 1)
          // Remove ticketId from end and re-add
          updateValues.pop()
          updateValues.push(ticketId)
          
          if (updateFields.length > 0) {
            await execute(
              `UPDATE ${tableName} SET ${updateFields.join(", ")}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
              updateValues
            )
          }
        }
      } else {
        throw updateError
      }
    }

    // Fetch updated ticket
    const ticket = await queryOne(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [ticketId]
    )

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found after update" },
        { status: 404 }
      )
    }

    // Parse JSON fields
    if (ticket && ticket.selectedServices && typeof ticket.selectedServices === 'string') {
      try {
        ticket.selectedServices = JSON.parse(ticket.selectedServices)
      } catch (e) {
        console.error("[API] Error parsing selectedServices:", e)
        ticket.selectedServices = []
      }
    }

    if (ticket && ticket.editHistory && typeof ticket.editHistory === 'string') {
      try {
        ticket.editHistory = JSON.parse(ticket.editHistory)
      } catch (e) {
        console.error("[API] Error parsing editHistory:", e)
        ticket.editHistory = []
      }
    }

    return NextResponse.json({ ticket })
  } catch (error: any) {
    console.error("[API] Error updating repair ticket:", error)
    console.error("[API] Error details:", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      stack: error?.stack?.substring(0, 500),
    })
    
    // Provide more specific error messages
    let errorMessage = "Failed to update repair ticket"
    if (error?.code === "ER_BAD_FIELD_ERROR") {
      errorMessage = `Database column error: ${error.sqlMessage || "Unknown column"}`
    } else if (error?.code === "ER_DUP_ENTRY") {
      errorMessage = "Duplicate entry. This value already exists."
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          code: error?.code,
          sqlMessage: error?.sqlMessage,
          message: error?.message
        } : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE repair ticket (tenant-specific)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const deleted = searchParams.get("deleted") === "true"

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
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

    // Handle async params (Next.js 15+)
    const resolvedParams = await Promise.resolve(params)
    const ticketId = resolvedParams.id

    const tables = getTenantTableNames(user.tenantId)
    const repairTable = escapeId(tables.repairTickets)
    const deletedTable = escapeId(tables.deletedTickets)

    if (deleted) {
      // Permanently delete from deleted tickets table
      await execute(
        `DELETE FROM ${deletedTable} WHERE id = ? AND userId = ?`,
        [ticketId, userId]
      )
      return NextResponse.json({ message: "Ticket permanently deleted" })
    } else {
      // Move to deleted tickets before deleting from main table
      const ticket = await queryOne(
        `SELECT * FROM ${repairTable} WHERE id = ?`,
        [ticketId]
      )

      if (!ticket) {
        return NextResponse.json(
          { error: "Ticket not found" },
          { status: 404 }
        )
      }

      // Ensure deletedTickets table exists
      const tablesExist = await tenantTablesExist(user.tenantId)
      if (!tablesExist) {
        console.log(`[API] Creating tenant tables for tenantId: ${user.tenantId}`)
        await createTenantTables(user.tenantId)
        console.log(`[API] ✅ Tenant tables created`)
      }

      // Insert all ticket data into deletedTickets table
      // Include all fields including budget, createdAt, simTray, waterDamaged, etc.
      try {
        console.log(`[API] Attempting to insert ticket ${ticketId} into ${deletedTable}`)
        console.log(`[API] Ticket data:`, {
          id: ticket.id,
          customerName: ticket.customerName,
          clientId: ticket.clientId,
          repairNumber: ticket.repairNumber
        })
        
        await execute(
          `INSERT INTO ${deletedTable} (id, userId, repairNumber, clientId, customerName, contact, receivedBy, imeiNo,
            brand, model, serialNo, softwareVersion, warranty, battery, charger,
            simCard, simTray, memoryCard, loanEquipment, equipmentObs, repairObs,
            selectedServices, \`condition\`, problem, price, budget, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ticket.id,
            ticket.userId,
            ticket.repairNumber || null,
            ticket.clientId || null,
            ticket.customerName || null,
            ticket.contact || null,
            ticket.receivedBy || null,
            ticket.imeiNo || null,
            ticket.brand || null,
            ticket.model || null,
            ticket.serialNo || null,
            ticket.softwareVersion || null,
            ticket.warranty || null,
            ticket.battery || false,
            ticket.charger || false,
            ticket.simCard || false,
            ticket.simTray || false,
            ticket.memoryCard || false,
            ticket.loanEquipment || false,
            ticket.equipmentObs || null,
            ticket.repairObs || null,
            ticket.selectedServices ? (typeof ticket.selectedServices === 'string' ? ticket.selectedServices : JSON.stringify(ticket.selectedServices)) : null,
            ticket.condition || null,
            ticket.problem || null,
            ticket.price || null,
            ticket.budget || null,
            ticket.status || 'PENDING'
          ]
        )
        console.log(`[API] ✅ Successfully moved ticket ${ticketId} to deletedTickets table`)
        
        // Verify the insert worked by querying the deleted table
        const verifyTicket = await queryOne(
          `SELECT id, customerName, deletedAt FROM ${deletedTable} WHERE id = ?`,
          [ticketId]
        )
        console.log(`[API] ✅ Verified ticket in deletedTickets:`, verifyTicket ? { id: verifyTicket.id, customerName: verifyTicket.customerName, deletedAt: verifyTicket.deletedAt } : 'NOT FOUND')
      } catch (insertError: any) {
        console.error(`[API] ❌ Error inserting into deletedTickets:`, {
          code: insertError?.code,
          errno: insertError?.errno,
          sqlState: insertError?.sqlState,
          sqlMessage: insertError?.sqlMessage,
          message: insertError?.message,
          table: deletedTable
        })
        // If it's a duplicate entry error, the ticket might already be in trash, continue with deletion
        if (insertError.code === 'ER_DUP_ENTRY') {
          console.log(`[API] Ticket ${ticketId} already exists in deletedTickets, continuing with deletion`)
        } else {
          throw insertError
        }
      }

      // Delete from main repair table
      await execute(
        `DELETE FROM ${repairTable} WHERE id = ?`,
        [ticketId]
      )
      console.log(`[API] ✅ Successfully deleted ticket ${ticketId} from repairTickets table`)

      return NextResponse.json({ message: "Ticket deleted successfully" })
    }
  } catch (error: any) {
    console.error("[API] Error deleting repair ticket:", error)
    console.error("[API] Error details:", {
      code: error?.code,
      errno: error?.errno,
      sqlState: error?.sqlState,
      sqlMessage: error?.sqlMessage,
      message: error?.message,
    })
    
    // Provide more specific error messages
    let errorMessage = "Failed to delete repair ticket"
    if (error?.code === "ER_NO_SUCH_TABLE") {
      errorMessage = "Database table not found. Please try again."
    } else if (error?.code === "ER_DUP_ENTRY") {
      errorMessage = "Ticket already exists in trash"
    } else if (error?.sqlMessage) {
      errorMessage = error.sqlMessage
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          code: error?.code,
          sqlMessage: error?.sqlMessage,
        } : undefined
      },
      { status: 500 }
    )
  }
}
