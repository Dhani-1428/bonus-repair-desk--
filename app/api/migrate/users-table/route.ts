import { NextRequest, NextResponse } from "next/server"
import { query, execute } from "@/lib/mysql"

export async function POST(request: NextRequest) {
  try {
    console.log("[Migration] Starting migration to add company info columns to users table...")

    // Check if columns exist
    let existingColumns: string[] = []
    try {
      const columns = await query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
      `) as any[]
      existingColumns = columns.map((col) => col.COLUMN_NAME)
      console.log("[Migration] Existing columns:", existingColumns)
    } catch (error: any) {
      console.error("[Migration] Error checking columns:", error)
    }

    const addedColumns: string[] = []

    // Add address column if it doesn't exist
    if (!existingColumns.includes('address')) {
      try {
        await execute(`
          ALTER TABLE users 
          ADD COLUMN address VARCHAR(500) DEFAULT NULL
        `)
        addedColumns.push('address')
        console.log("[Migration] ✅ Added address column")
      } catch (e: any) {
        if (!e.message?.includes("Duplicate column")) {
          console.error("[Migration] Error adding address column:", e)
          throw e
        }
      }
    } else {
      console.log("[Migration] ⏭️  address column already exists")
    }

    // Add companyEmail column if it doesn't exist
    if (!existingColumns.includes('companyEmail')) {
      try {
        await execute(`
          ALTER TABLE users 
          ADD COLUMN companyEmail VARCHAR(255) DEFAULT NULL
        `)
        addedColumns.push('companyEmail')
        console.log("[Migration] ✅ Added companyEmail column")
      } catch (e: any) {
        if (!e.message?.includes("Duplicate column")) {
          console.error("[Migration] Error adding companyEmail column:", e)
          throw e
        }
      }
    } else {
      console.log("[Migration] ⏭️  companyEmail column already exists")
    }

    // Add website column if it doesn't exist
    if (!existingColumns.includes('website')) {
      try {
        await execute(`
          ALTER TABLE users 
          ADD COLUMN website VARCHAR(255) DEFAULT NULL
        `)
        addedColumns.push('website')
        console.log("[Migration] ✅ Added website column")
      } catch (e: any) {
        if (!e.message?.includes("Duplicate column")) {
          console.error("[Migration] Error adding website column:", e)
          throw e
        }
      }
    } else {
      console.log("[Migration] ⏭️  website column already exists")
    }

    // Verify columns
    const verifyColumns = await query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('address', 'companyEmail', 'website')
      ORDER BY COLUMN_NAME
    `) as any[]

    console.log("[Migration] ✅ Migration complete!")

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully. ${addedColumns.length > 0 ? `Added columns: ${addedColumns.join(', ')}` : 'All columns already exist.'}`,
      addedColumns,
      existingColumns: existingColumns,
      allColumns: verifyColumns
    }, { status: 200 })

  } catch (error: any) {
    console.error("[Migration] ❌ Migration failed:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Migration failed",
        details: error.code || "Unknown error"
      },
      { status: 500 }
    )
  }
}

