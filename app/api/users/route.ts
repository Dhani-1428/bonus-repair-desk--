import { NextRequest, NextResponse } from "next/server"
import { query, queryOne, execute } from "@/lib/mysql"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

// GET all users or single user by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")
    
    if (userId) {
      // Get single user with all fields
      const user = await queryOne(`
        SELECT id, name, email, role, shopName, contactNumber, tenantId, address, companyEmail, website, vatNumber, createdAt, updatedAt
        FROM users
        WHERE id = ?
      `, [userId])
      
      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json({ user })
    } else {
      // Get all users with all fields
      const users = await query(`
        SELECT id, name, email, role, shopName, contactNumber, tenantId, address, companyEmail, website, vatNumber, createdAt, updatedAt
        FROM users
        ORDER BY createdAt DESC
      `)

      return NextResponse.json({ users })
    }
  } catch (error) {
    console.error("[API] Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, shopName, contactNumber, role } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await queryOne(
      `SELECT id FROM users WHERE email = ?`,
      [email]
    )

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate IDs
    const userId = uuidv4()
    const tenantId = uuidv4()

    // Create user
    await execute(
      `INSERT INTO users (id, name, email, password, shopName, contactNumber, role, tenantId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, hashedPassword, shopName || null, contactNumber || null, role || "USER", tenantId]
    )

    // Get created user
    const user = await queryOne(
      `SELECT id, name, email, role, shopName, contactNumber, tenantId, createdAt
       FROM users WHERE id = ?`,
      [userId]
    )

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error("[API] Error creating user:", error)
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    )
  }
}

// PUT update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, shopName, contactNumber } = body

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    await execute(
      `UPDATE users SET name = ?, email = ?, shopName = ?, contactNumber = ? WHERE id = ?`,
      [name, email, shopName, contactNumber, id]
    )

    const user = await queryOne(
      `SELECT id, name, email, role, shopName, contactNumber, tenantId, createdAt
       FROM users WHERE id = ?`,
      [id]
    )

    return NextResponse.json({ user })
  } catch (error) {
    console.error("[API] Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    await execute(`DELETE FROM users WHERE id = ?`, [id])

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("[API] Error deleting user:", error)
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
