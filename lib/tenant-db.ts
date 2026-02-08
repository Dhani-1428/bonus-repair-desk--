/**
 * Multi-tenant database utilities
 * Each user gets their own set of tables prefixed with their tenantId
 */

import { query, execute, escapeId } from "./mysql"

export interface TenantTableNames {
  repairTickets: string
  teamMembers: string
  deletedTickets: string
  deletedMembers: string
}

/**
 * Get table names for a specific tenant
 */
export function getTenantTableNames(tenantId: string): TenantTableNames {
  const prefix = `tenant_${tenantId.replace(/-/g, "_")}`
  return {
    repairTickets: `${prefix}_repair_tickets`,
    teamMembers: `${prefix}_team_members`,
    deletedTickets: `${prefix}_deleted_tickets`,
    deletedMembers: `${prefix}_deleted_members`,
  }
}

/**
 * Create tables for a new tenant
 */
export async function createTenantTables(tenantId: string): Promise<void> {
  const tables = getTenantTableNames(tenantId)
  const repairTicketsTable = escapeId(tables.repairTickets)
  const teamMembersTable = escapeId(tables.teamMembers)
  const deletedTicketsTable = escapeId(tables.deletedTickets)
  const deletedMembersTable = escapeId(tables.deletedMembers)

  // Create repair_tickets table
  await execute(`
    CREATE TABLE IF NOT EXISTS ${repairTicketsTable} (
      repairId BIGINT AUTO_INCREMENT PRIMARY KEY,
      id VARCHAR(36) UNIQUE NOT NULL,
      userId VARCHAR(36) NOT NULL,
      repairNumber VARCHAR(50) UNIQUE NULL,
      clientId VARCHAR(255),
      customerName VARCHAR(255) NOT NULL,
      contact VARCHAR(255) DEFAULT NULL,
      receivedBy VARCHAR(255) DEFAULT NULL,
      imeiNo VARCHAR(15) UNIQUE DEFAULT NULL,
      brand VARCHAR(100) DEFAULT NULL,
      model VARCHAR(100) DEFAULT NULL,
      serialNo VARCHAR(255),
      softwareVersion VARCHAR(100),
      warranty VARCHAR(50) DEFAULT 'Without Warranty',
      simCard BOOLEAN DEFAULT FALSE,
      simTray BOOLEAN DEFAULT FALSE,
      memoryCard BOOLEAN DEFAULT FALSE,
      charger BOOLEAN DEFAULT FALSE,
      battery BOOLEAN DEFAULT FALSE,
      waterDamaged BOOLEAN DEFAULT FALSE,
      loanEquipment BOOLEAN DEFAULT FALSE,
      equipmentObs TEXT,
      phoneIssue TEXT,
      repairObs TEXT,
      selectedServices JSON,
      \`condition\` TEXT,
      problem TEXT DEFAULT NULL,
      price DECIMAL(10, 2) DEFAULT NULL,
      budget DECIMAL(10, 2) DEFAULT NULL,
      priceType VARCHAR(10) DEFAULT 'budget',
      batchId VARCHAR(100) DEFAULT NULL,
      status ENUM('PENDING', 'NOT_OK', 'COMPLETED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING',
      editHistory JSON DEFAULT NULL,
      deliveredDate DATETIME DEFAULT NULL,
      deleted BOOLEAN DEFAULT FALSE,
      deletedAt DATETIME DEFAULT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_userId (userId),
      INDEX idx_repairNumber (repairNumber),
      INDEX idx_imeiNo (imeiNo),
      INDEX idx_status (status),
      INDEX idx_batchId (batchId),
      INDEX idx_clientId_customerName (clientId, customerName),
      INDEX idx_deleted (deleted)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  // Create team_members table
  await execute(`
    CREATE TABLE IF NOT EXISTS ${teamMembersTable} (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'member',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  // Create deleted_tickets table
  await execute(`
    CREATE TABLE IF NOT EXISTS ${deletedTicketsTable} (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      repairNumber VARCHAR(50) NOT NULL,
      clientId VARCHAR(255),
      customerName VARCHAR(255) NOT NULL,
      contact VARCHAR(255) DEFAULT NULL,
      receivedBy VARCHAR(255) DEFAULT NULL,
      imeiNo VARCHAR(15) DEFAULT NULL,
      brand VARCHAR(100) DEFAULT NULL,
      model VARCHAR(100) DEFAULT NULL,
      serialNo VARCHAR(255),
      softwareVersion VARCHAR(100),
      warranty VARCHAR(50),
      simCard BOOLEAN,
      simTray BOOLEAN,
      memoryCard BOOLEAN,
      charger BOOLEAN,
      battery BOOLEAN,
      waterDamaged BOOLEAN,
      loanEquipment BOOLEAN,
      equipmentObs TEXT,
      phoneIssue TEXT,
      repairObs TEXT,
      selectedServices JSON,
      \`condition\` TEXT,
      problem TEXT DEFAULT NULL,
      price DECIMAL(10, 2) DEFAULT NULL,
      budget DECIMAL(10, 2) DEFAULT NULL,
      priceType VARCHAR(10) DEFAULT 'budget',
      status ENUM('PENDING', 'NOT_OK', 'COMPLETED', 'DELIVERED', 'CANCELLED'),
      deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  // Create deleted_members table
  await execute(`
    CREATE TABLE IF NOT EXISTS ${deletedMembersTable} (
      id VARCHAR(36) PRIMARY KEY,
      userId VARCHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(50),
      deletedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_userId (userId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

/**
 * Get all tenant IDs from the database
 */
export async function getAllTenantIds(): Promise<string[]> {
  const users = await query(`
    SELECT tenantId 
    FROM users 
    WHERE role != 'SUPER_ADMIN'
  `) as any[]

  return users.map((u) => u.tenantId).filter(Boolean)
}

/**
 * Get all tables for a tenant (for super admin)
 */
export async function getTenantTables(tenantId: string): Promise<any> {
  const tables = getTenantTableNames(tenantId)

  const repairTicketsTable = escapeId(tables.repairTickets)
  const teamMembersTable = escapeId(tables.teamMembers)
  const deletedTicketsTable = escapeId(tables.deletedTickets)
  const deletedMembersTable = escapeId(tables.deletedMembers)

  const [repairTickets, teamMembers, deletedTickets, deletedMembers] = await Promise.all([
    query(`SELECT * FROM ${repairTicketsTable} ORDER BY createdAt DESC`),
    query(`SELECT * FROM ${teamMembersTable} ORDER BY createdAt DESC`),
    query(`SELECT * FROM ${deletedTicketsTable} ORDER BY deletedAt DESC`),
    query(`SELECT * FROM ${deletedMembersTable} ORDER BY deletedAt DESC`),
  ])

  return {
    repairTickets,
    teamMembers,
    deletedTickets,
    deletedMembers,
  }
}

/**
 * Check if tenant tables exist
 */
export async function tenantTablesExist(tenantId: string): Promise<boolean> {
  const tables = getTenantTableNames(tenantId)
  try {
    const tableName = escapeId(tables.repairTickets)
    await query(`SELECT 1 FROM ${tableName} LIMIT 1`)
    return true
  } catch {
    return false
  }
}

/**
 * Migrate existing tenant tables to add missing columns
 * This ensures backward compatibility when new columns are added
 */
export async function migrateTenantTables(tenantId: string): Promise<void> {
  const tables = getTenantTableNames(tenantId)
  const repairTicketsTable = escapeId(tables.repairTickets)
  const deletedTicketsTable = escapeId(tables.deletedTickets)

  try {
    // Check if repair_tickets table exists
    const tableExists = await tenantTablesExist(tenantId)
    if (!tableExists) {
      return // Table doesn't exist, will be created with all columns
    }

    // Check if repairId column exists in repair_tickets table
    try {
      await query(`SELECT repairId FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding repairId AUTO_INCREMENT column to ${tables.repairTickets}`)
        
        // First, make repairNumber nullable if it's not already
        try {
          await execute(`
            ALTER TABLE ${repairTicketsTable} 
            MODIFY COLUMN repairNumber VARCHAR(50) UNIQUE NULL
          `)
          console.log(`[Migration] ✅ Made repairNumber nullable`)
        } catch (modifyError: any) {
          // If modification fails, continue anyway
          console.warn(`[Migration] Could not modify repairNumber column:`, modifyError.message)
        }
        
        // Drop SPU column if it exists
        try {
          await execute(`
            ALTER TABLE ${repairTicketsTable} 
            DROP COLUMN spu
          `)
          console.log(`[Migration] ✅ Dropped SPU column from ${tables.repairTickets}`)
        } catch (dropError: any) {
          // If column doesn't exist, that's fine
          if (dropError.code !== "ER_BAD_FIELD_ERROR" && !dropError.message?.includes("Unknown column")) {
            console.warn(`[Migration] Could not drop SPU column:`, dropError.message)
          }
        }
        
        // Add repairId column (as AUTO_INCREMENT, but keep existing PRIMARY KEY on id)
        // First check if id is PRIMARY KEY
        try {
          await execute(`
            ALTER TABLE ${repairTicketsTable} 
            ADD COLUMN repairId BIGINT AUTO_INCREMENT UNIQUE NOT NULL FIRST
          `)
          console.log(`[Migration] ✅ Added repairId column to ${tables.repairTickets}`)
        } catch (addError: any) {
          // If it fails because of PRIMARY KEY constraint, try without PRIMARY KEY
          if (addError.code === "ER_MULTIPLE_PRI_KEY") {
            await execute(`
              ALTER TABLE ${repairTicketsTable} 
              ADD COLUMN repairId BIGINT AUTO_INCREMENT UNIQUE NOT NULL FIRST
            `)
            console.log(`[Migration] ✅ Added repairId column (without PRIMARY KEY) to ${tables.repairTickets}`)
          } else {
            throw addError
          }
        }
        console.log(`[Migration] ✅ Added repairId column to ${tables.repairTickets}`)
        
        // Update existing rows to have repairNumber based on repairId
        console.log(`[Migration] Updating existing repairNumber based on repairId`)
        await execute(`
          UPDATE ${repairTicketsTable}
          SET repairNumber = CONCAT(YEAR(COALESCE(createdAt, NOW())), '-', LPAD(repairId, 4, '0'))
          WHERE repairNumber IS NULL OR repairNumber = ''
        `)
        console.log(`[Migration] ✅ Updated existing repairNumber values`)
      } else {
        throw error
      }
    }

    // Check if waterDamaged column exists in repair_tickets table
    try {
      await query(`SELECT waterDamaged FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding waterDamaged column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN waterDamaged BOOLEAN DEFAULT FALSE AFTER battery
        `)
        console.log(`[Migration] ✅ Added waterDamaged column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Check if problem column is nullable in repair_tickets table
    try {
      const columns = await query(`SHOW COLUMNS FROM ${repairTicketsTable} WHERE Field = 'problem'`) as any[]
      if (columns && columns.length > 0 && columns[0].Null === 'NO') {
        console.log(`[Migration] Making problem column nullable in ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          MODIFY COLUMN problem TEXT DEFAULT NULL
        `)
        console.log(`[Migration] ✅ Made problem column nullable in ${tables.repairTickets}`)
      }
    } catch (error: any) {
      // If column doesn't exist or modification fails, that's fine
      if (error.code !== "ER_BAD_FIELD_ERROR" && !error.message?.includes("Unknown column")) {
        console.warn(`[Migration] Could not modify problem column:`, error.message)
      }
    }

    // Check if problem column is nullable in deleted_tickets table
    try {
      const columns = await query(`SHOW COLUMNS FROM ${deletedTicketsTable} WHERE Field = 'problem'`) as any[]
      if (columns && columns.length > 0 && columns[0].Null === 'NO') {
        console.log(`[Migration] Making problem column nullable in ${tables.deletedTickets}`)
        await execute(`
          ALTER TABLE ${deletedTicketsTable} 
          MODIFY COLUMN problem TEXT DEFAULT NULL
        `)
        console.log(`[Migration] ✅ Made problem column nullable in ${tables.deletedTickets}`)
      }
    } catch (error: any) {
      // If column doesn't exist or modification fails, that's fine
      if (error.code !== "ER_BAD_FIELD_ERROR" && !error.message?.includes("Unknown column")) {
        console.warn(`[Migration] Could not modify problem column:`, error.message)
      }
    }

    // Check if waterDamaged column exists in deleted_tickets table
    try {
      await query(`SELECT waterDamaged FROM ${deletedTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding waterDamaged column to ${tables.deletedTickets}`)
        await execute(`
          ALTER TABLE ${deletedTicketsTable} 
          ADD COLUMN waterDamaged BOOLEAN DEFAULT NULL AFTER battery
        `)
        console.log(`[Migration] ✅ Added waterDamaged column to ${tables.deletedTickets}`)
      } else {
        throw error
      }
    }

    // Check if receivedBy column exists in repair_tickets table
    try {
      await query(`SELECT receivedBy FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding receivedBy column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN receivedBy VARCHAR(255) DEFAULT NULL AFTER contact
        `)
        console.log(`[Migration] ✅ Added receivedBy column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Check if receivedBy column exists in deleted_tickets table
    try {
      await query(`SELECT receivedBy FROM ${deletedTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding receivedBy column to ${tables.deletedTickets}`)
        await execute(`
          ALTER TABLE ${deletedTicketsTable} 
          ADD COLUMN receivedBy VARCHAR(255) DEFAULT NULL AFTER contact
        `)
        console.log(`[Migration] ✅ Added receivedBy column to ${tables.deletedTickets}`)
      } else {
        throw error
      }
    }

    // Check if budget column exists in repair_tickets table
    try {
      await query(`SELECT budget FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding budget column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN budget DECIMAL(10, 2) DEFAULT NULL AFTER price
        `)
        console.log(`[Migration] ✅ Added budget column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Check if budget column exists in deleted_tickets table
    try {
      await query(`SELECT budget FROM ${deletedTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding budget column to ${tables.deletedTickets}`)
        await execute(`
          ALTER TABLE ${deletedTicketsTable} 
          ADD COLUMN budget DECIMAL(10, 2) DEFAULT NULL AFTER price
        `)
        console.log(`[Migration] ✅ Added budget column to ${tables.deletedTickets}`)
      } else {
        throw error
      }
    }

    // Check if priceType column exists in repair_tickets table
    try {
      await query(`SELECT priceType FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding priceType column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN priceType VARCHAR(10) DEFAULT 'budget' AFTER budget
        `)
        console.log(`[Migration] ✅ Added priceType column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Check if priceType column exists in deleted_tickets table
    try {
      await query(`SELECT priceType FROM ${deletedTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding priceType column to ${tables.deletedTickets}`)
        await execute(`
          ALTER TABLE ${deletedTicketsTable} 
          ADD COLUMN priceType VARCHAR(10) DEFAULT 'budget' AFTER budget
        `)
        console.log(`[Migration] ✅ Added priceType column to ${tables.deletedTickets}`)
      } else {
        throw error
      }
    }

    // Check if phoneIssue column exists in repair_tickets table
    try {
      await query(`SELECT phoneIssue FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding phoneIssue column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN phoneIssue TEXT AFTER equipmentObs
        `)
        console.log(`[Migration] ✅ Added phoneIssue column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Check if phoneIssue column exists in deleted_tickets table
    try {
      await query(`SELECT phoneIssue FROM ${deletedTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding phoneIssue column to ${tables.deletedTickets}`)
        await execute(`
          ALTER TABLE ${deletedTicketsTable} 
          ADD COLUMN phoneIssue TEXT AFTER equipmentObs
        `)
        console.log(`[Migration] ✅ Added phoneIssue column to ${tables.deletedTickets}`)
      } else {
        throw error
      }
    }

    // Make contact, imeiNo, brand, model, price, and problem nullable in repair_tickets table
    try {
      const columns = await query(`SHOW COLUMNS FROM ${repairTicketsTable}`) as any[]
      const columnMap = new Map(columns.map((col: any) => [col.Field, col]))
      
      // Make contact nullable
      if (columnMap.get('contact')?.Null === 'NO') {
        await execute(`ALTER TABLE ${repairTicketsTable} MODIFY COLUMN contact VARCHAR(255) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made contact nullable in ${tables.repairTickets}`)
      }
      
      // Make imeiNo nullable (remove UNIQUE constraint first if needed)
      if (columnMap.get('imeiNo')?.Null === 'NO') {
        try {
          await execute(`ALTER TABLE ${repairTicketsTable} DROP INDEX imeiNo`)
        } catch (e: any) {
          // Index might not exist or have different name
        }
        await execute(`ALTER TABLE ${repairTicketsTable} MODIFY COLUMN imeiNo VARCHAR(15) DEFAULT NULL`)
        // Re-add unique index only if not null
        try {
          await execute(`CREATE UNIQUE INDEX idx_imeiNo_unique ON ${repairTicketsTable} (imeiNo) WHERE imeiNo IS NOT NULL`)
        } catch (e: any) {
          // Index creation might fail, that's okay
        }
        console.log(`[Migration] ✅ Made imeiNo nullable in ${tables.repairTickets}`)
      }
      
      // Make brand nullable
      if (columnMap.get('brand')?.Null === 'NO') {
        await execute(`ALTER TABLE ${repairTicketsTable} MODIFY COLUMN brand VARCHAR(100) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made brand nullable in ${tables.repairTickets}`)
      }
      
      // Make model nullable
      if (columnMap.get('model')?.Null === 'NO') {
        await execute(`ALTER TABLE ${repairTicketsTable} MODIFY COLUMN model VARCHAR(100) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made model nullable in ${tables.repairTickets}`)
      }
      
      // Make price nullable
      if (columnMap.get('price')?.Null === 'NO') {
        await execute(`ALTER TABLE ${repairTicketsTable} MODIFY COLUMN price DECIMAL(10, 2) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made price nullable in ${tables.repairTickets}`)
      }
    } catch (error: any) {
      console.warn(`[Migration] Could not modify columns in ${tables.repairTickets}:`, error.message)
    }

    // Make contact, imeiNo, brand, model, price, and problem nullable in deleted_tickets table
    try {
      const columns = await query(`SHOW COLUMNS FROM ${deletedTicketsTable}`) as any[]
      const columnMap = new Map(columns.map((col: any) => [col.Field, col]))
      
      // Make contact nullable
      if (columnMap.get('contact')?.Null === 'NO') {
        await execute(`ALTER TABLE ${deletedTicketsTable} MODIFY COLUMN contact VARCHAR(255) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made contact nullable in ${tables.deletedTickets}`)
      }
      
      // Make imeiNo nullable
      if (columnMap.get('imeiNo')?.Null === 'NO') {
        await execute(`ALTER TABLE ${deletedTicketsTable} MODIFY COLUMN imeiNo VARCHAR(15) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made imeiNo nullable in ${tables.deletedTickets}`)
      }
      
      // Make brand nullable
      if (columnMap.get('brand')?.Null === 'NO') {
        await execute(`ALTER TABLE ${deletedTicketsTable} MODIFY COLUMN brand VARCHAR(100) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made brand nullable in ${tables.deletedTickets}`)
      }
      
      // Make model nullable
      if (columnMap.get('model')?.Null === 'NO') {
        await execute(`ALTER TABLE ${deletedTicketsTable} MODIFY COLUMN model VARCHAR(100) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made model nullable in ${tables.deletedTickets}`)
      }
      
      // Make price nullable
      if (columnMap.get('price')?.Null === 'NO') {
        await execute(`ALTER TABLE ${deletedTicketsTable} MODIFY COLUMN price DECIMAL(10, 2) DEFAULT NULL`)
        console.log(`[Migration] ✅ Made price nullable in ${tables.deletedTickets}`)
      }
    } catch (error: any) {
      console.warn(`[Migration] Could not modify columns in ${tables.deletedTickets}:`, error.message)
    }

    // Check if batchId column exists in repair_tickets table
    try {
      await query(`SELECT batchId FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding batchId column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN batchId VARCHAR(100) DEFAULT NULL AFTER budget
        `)
        console.log(`[Migration] ✅ Added batchId column to ${tables.repairTickets}`)
        
        // Add index for batchId
        try {
          await execute(`
            ALTER TABLE ${repairTicketsTable} 
            ADD INDEX idx_batchId (batchId)
          `)
          console.log(`[Migration] ✅ Added index for batchId`)
        } catch (indexError: any) {
          // Index might already exist, that's fine
          if (indexError.code !== "ER_DUP_KEYNAME") {
            console.warn(`[Migration] Could not add batchId index:`, indexError.message)
          }
        }
        
        // Add composite index for clientId and customerName
        try {
          await execute(`
            ALTER TABLE ${repairTicketsTable} 
            ADD INDEX idx_clientId_customerName (clientId, customerName)
          `)
          console.log(`[Migration] ✅ Added composite index for clientId and customerName`)
        } catch (indexError: any) {
          // Index might already exist, that's fine
          if (indexError.code !== "ER_DUP_KEYNAME") {
            console.warn(`[Migration] Could not add composite index:`, indexError.message)
          }
        }
      } else {
        throw error
      }
    }

    // Check if editHistory column exists in repair_tickets table
    try {
      await query(`SELECT editHistory FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding editHistory column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN editHistory JSON DEFAULT NULL AFTER status
        `)
        console.log(`[Migration] ✅ Added editHistory column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Check if simTray column exists in repair_tickets table
    try {
      await query(`SELECT simTray FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding simTray column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN simTray BOOLEAN DEFAULT FALSE AFTER simCard
        `)
        console.log(`[Migration] ✅ Added simTray column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Check if simTray column exists in deleted_tickets table
    try {
      await query(`SELECT simTray FROM ${deletedTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding simTray column to ${tables.deletedTickets}`)
        await execute(`
          ALTER TABLE ${deletedTicketsTable} 
          ADD COLUMN simTray BOOLEAN DEFAULT NULL AFTER simCard
        `)
        console.log(`[Migration] ✅ Added simTray column to ${tables.deletedTickets}`)
      } else {
        throw error
      }
    }

    // Check if deliveredDate column exists in repair_tickets table
    try {
      await query(`SELECT deliveredDate FROM ${repairTicketsTable} LIMIT 1`)
    } catch (error: any) {
      // Column doesn't exist, add it
      if (error.code === "ER_BAD_FIELD_ERROR" || error.message?.includes("Unknown column")) {
        console.log(`[Migration] Adding deliveredDate column to ${tables.repairTickets}`)
        await execute(`
          ALTER TABLE ${repairTicketsTable} 
          ADD COLUMN deliveredDate DATETIME DEFAULT NULL AFTER editHistory
        `)
        console.log(`[Migration] ✅ Added deliveredDate column to ${tables.repairTickets}`)
      } else {
        throw error
      }
    }

    // Update status enum to include NOT_OK instead of IN_PROGRESS
    try {
      await execute(`
        ALTER TABLE ${repairTicketsTable}
        MODIFY COLUMN status ENUM('PENDING', 'NOT_OK', 'COMPLETED', 'DELIVERED', 'CANCELLED') DEFAULT 'PENDING'
      `)
      console.log(`[Migration] ✅ Updated status enum to include NOT_OK`)
    } catch (error: any) {
      // If modification fails, that's fine - might already be updated
      console.warn(`[Migration] Could not update status enum:`, error.message)
    }
  } catch (error: any) {
    // If table doesn't exist, that's fine - it will be created with all columns
    if (error.code === "ER_NO_SUCH_TABLE") {
      return
    }
    console.error(`[Migration] Error migrating tables for tenant ${tenantId}:`, error)
    // Don't throw - allow operation to continue
  }
}