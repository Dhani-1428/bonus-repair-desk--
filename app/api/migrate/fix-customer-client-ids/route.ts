import { NextRequest, NextResponse } from "next/server"
import { query, execute, escapeId } from "@/lib/mysql"
import { getTenantTableNames, tenantTablesExist, getAllTenantIds } from "@/lib/tenant-db"

/**
 * Migration endpoint to fix customer client IDs
 * Ensures customers with same name but different contact numbers get different client IDs
 * Customers with same name AND same contact get the same client ID
 */
export async function POST(request: NextRequest) {
  try {
    // Get all tenant IDs
    const tenantIds = await getAllTenantIds()
    
    if (!tenantIds || tenantIds.length === 0) {
      return NextResponse.json(
        { message: "No tenants found", migrated: 0, totalCustomers: 0 },
        { status: 200 }
      )
    }

    let totalMigrated = 0
    let totalCustomers = 0
    let totalTicketsUpdated = 0
    const migrationDetails: any[] = []

    // Process each tenant
    for (const tenantId of tenantIds) {
      try {
        // Check if tenant tables exist
        if (!(await tenantTablesExist(tenantId))) {
          console.log(`[Migration] Skipping tenant ${tenantId} - tables do not exist`)
          continue
        }

        const tables = getTenantTableNames(tenantId)
        const tableName = escapeId(tables.repairTickets)

        // Get all tickets with customer names and contacts
        const allTickets = await query(
          `SELECT id, customerName, contact, clientId, createdAt FROM ${tableName} 
           WHERE customerName IS NOT NULL AND customerName != '' 
           ORDER BY createdAt ASC`
        ) as any[]

        if (!allTickets || allTickets.length === 0) {
          console.log(`[Migration] No tickets found for tenant ${tenantId}`)
          continue
        }

        // Normalize contact for comparison
        const normalizeContact = (contact: string | null | undefined): string => {
          if (!contact) return ""
          return contact.replace(/[\s\-\(\)]/g, "").trim()
        }

        // Group tickets by customerName + contact (normalized)
        const customerGroups = new Map<string, any[]>()
        
        allTickets.forEach((ticket: any) => {
          if (!ticket.customerName) return
          
          const normalizedName = ticket.customerName.trim().toLowerCase()
          const normalizedContact = normalizeContact(ticket.contact)
          
          // Create unique key: name + contact (or "NO_CONTACT" if contact is empty)
          const groupKey = normalizedContact 
            ? `${normalizedName}::${normalizedContact}`
            : `${normalizedName}::NO_CONTACT`
          
          if (!customerGroups.has(groupKey)) {
            customerGroups.set(groupKey, [])
          }
          customerGroups.get(groupKey)!.push(ticket)
        })

        totalCustomers += customerGroups.size

        // For each customer group (name + contact combination), assign a unique client ID
        // CRITICAL: Each unique name+contact combination MUST get a unique client ID
        // Even if they currently share the same client ID, they need different ones
        
        // First, find the maximum client ID number used across all tickets
        let maxClientIdNumber = 0
        for (const tickets of customerGroups.values()) {
          for (const ticket of tickets) {
            if (ticket.clientId && typeof ticket.clientId === 'string') {
              const match = ticket.clientId.match(/^CLI-(\d{1,4})$/i)
              if (match) {
                const num = parseInt(match[1], 10)
                if (!isNaN(num) && num > maxClientIdNumber) {
                  maxClientIdNumber = num
                }
              }
            }
          }
        }
        
        let nextClientIdNumber = maxClientIdNumber + 1
        const customerClientIdMap = new Map<string, string>()
        const usedClientIds = new Set<string>()

        // First pass: Try to preserve existing client IDs, but only if they're unique
        // If multiple groups share the same client ID, we need to reassign
        for (const [groupKey, tickets] of customerGroups.entries()) {
          // Sort tickets by creation date (oldest first)
          const sortedTickets = tickets.sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || 0).getTime()
            const dateB = new Date(b.createdAt || 0).getTime()
            return dateA - dateB
          })

          // Find the first valid CLI- format client ID
          let existingClientId: string | null = null
          for (const ticket of sortedTickets) {
            if (ticket.clientId && typeof ticket.clientId === 'string') {
              const match = ticket.clientId.match(/^CLI-(\d{1,4})$/i)
              if (match) {
                existingClientId = ticket.clientId.toUpperCase()
                break
              }
            }
          }

          // Only use existing client ID if it's not already assigned to another group
          // This ensures each name+contact combination gets a unique ID
          if (existingClientId && !usedClientIds.has(existingClientId)) {
            customerClientIdMap.set(groupKey, existingClientId)
            usedClientIds.add(existingClientId)
            console.log(`[Migration] Preserving client ID ${existingClientId} for group: ${groupKey}`)
          }
        }

        // Second pass: assign new client IDs to groups without unique existing IDs
        for (const [groupKey, tickets] of customerGroups.entries()) {
          if (!customerClientIdMap.has(groupKey)) {
            // Generate new client ID
            let newClientId: string
            let attempts = 0
            const maxAttempts = 10000 // Prevent infinite loop
            
            do {
              newClientId = `CLI-${String(nextClientIdNumber).padStart(4, "0")}`
              nextClientIdNumber++
              attempts++
              
              // Check if this ID is already assigned to another group
              if (!usedClientIds.has(newClientId)) {
                usedClientIds.add(newClientId)
                break
              }
            } while (attempts < maxAttempts)

            if (attempts >= maxAttempts) {
              console.error(`[Migration] Failed to generate unique client ID for tenant ${tenantId}, group ${groupKey}`)
              continue
            }

            customerClientIdMap.set(groupKey, newClientId)
            console.log(`[Migration] Assigning new client ID ${newClientId} to group: ${groupKey}`)
          }
        }

        // Third pass: update all tickets with the correct client IDs
        let tenantTicketsUpdated = 0
        for (const [groupKey, tickets] of customerGroups.entries()) {
          const assignedClientId = customerClientIdMap.get(groupKey)
          if (!assignedClientId) continue

          for (const ticket of tickets) {
            // Only update if the client ID is different
            if (!ticket.clientId || ticket.clientId !== assignedClientId) {
              try {
                await execute(
                  `UPDATE ${tableName} SET clientId = ? WHERE id = ?`,
                  [assignedClientId, ticket.id]
                )
                tenantTicketsUpdated++
              } catch (error: any) {
                console.error(`[Migration] Error updating ticket ${ticket.id} for tenant ${tenantId}:`, error)
              }
            }
          }
        }

        totalTicketsUpdated += tenantTicketsUpdated
        totalMigrated++

        // Get customer name from first ticket in group for reporting
        const firstGroup = customerGroups.values().next().value
        const sampleCustomerName = firstGroup && firstGroup.length > 0 ? firstGroup[0].customerName : "Unknown"

        migrationDetails.push({
          tenantId,
          customersProcessed: customerGroups.size,
          ticketsUpdated: tenantTicketsUpdated,
          totalTickets: allTickets.length,
          sampleCustomer: sampleCustomerName
        })

        console.log(`[Migration] ✅ Tenant ${tenantId}: ${customerGroups.size} customers, ${tenantTicketsUpdated} tickets updated`)

      } catch (error: any) {
        console.error(`[Migration] Error processing tenant ${tenantId}:`, error)
        migrationDetails.push({
          tenantId,
          error: error.message || "Unknown error",
          customersProcessed: 0,
          ticketsUpdated: 0
        })
      }
    }

    return NextResponse.json(
      {
        message: `Migration completed. Processed ${totalMigrated} tenants, ${totalCustomers} unique customers, ${totalTicketsUpdated} tickets updated.`,
        migrated: totalMigrated,
        totalCustomers,
        totalTicketsUpdated,
        details: migrationDetails
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
