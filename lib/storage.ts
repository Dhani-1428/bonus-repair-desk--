/**
 * Database API utilities
 * Replaces localStorage with MySQL database via API routes
 */

export interface User {
  id: string
  name: string
  email: string
  role?: "admin" | "member" | "super_admin"
  shopName?: string
  contactNumber?: string
  createdAt: string
  updatedAt?: string
  address?: string | null
  companyEmail?: string | null
  website?: string | null
  vatNumber?: string | null
  tenantId?: string
}

// API base URL
const API_BASE = typeof window !== "undefined" ? window.location.origin : ""

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }))
      throw new Error(error.error || "Request failed")
    }

    return await response.json()
  } catch (error: any) {
    console.error(`[API] Error calling ${endpoint}:`, error)
    throw error
  }
}

// Get current user from session storage (set after login)
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const userData = sessionStorage.getItem("user")
  if (!userData) return null
  try {
    return JSON.parse(userData)
  } catch {
    return null
  }
}

export function getCurrentUserId(): string | null {
  const user = getCurrentUser()
  return user?.id || null
}

export function isSuperAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === "super_admin" || user?.email === "superadmin@admin.com"
}

// Get all users (for super admin)
export async function getAllUsers(): Promise<User[]> {
  try {
    const response = await apiCall<{ users: User[] }>("/api/users")
    return response.users || []
  } catch (error) {
    console.error("[Storage] Error fetching users:", error)
    return []
  }
}

// Get user data (repair tickets, team members, etc.)
export async function getUserData<T>(
  key: string,
  defaultValue: T,
  targetUserId?: string
): Promise<T> {
  const userId = targetUserId || getCurrentUserId()
  if (!userId) return defaultValue

  try {
    switch (key) {
      case "repairTickets": {
        const response = await apiCall<{ tickets: any[] }>(
          `/api/repairs?userId=${userId}`
        )
        return (response.tickets || defaultValue) as T
      }
      case "teamMembers": {
        const response = await apiCall<{ members: any[] }>(
          `/api/team-members?userId=${userId}`
        )
        return (response.members || defaultValue) as T
      }
      default:
        return defaultValue
    }
  } catch (error) {
    console.error(`[Storage] Error fetching ${key}:`, error)
    return defaultValue
  }
}

// Set user data (create/update)
export async function setUserData<T>(
  key: string,
  value: T,
  targetUserId?: string
): Promise<void> {
  const userId = targetUserId || getCurrentUserId()
  if (!userId) return

  try {
    switch (key) {
      case "repairTickets": {
        // For repair tickets, we use the create API
        if (Array.isArray(value) && value.length > 0) {
          // This is typically handled by the repair creation form
          // We don't bulk create here
          console.warn("[Storage] Bulk repair ticket creation not supported. Use individual API calls.")
        }
        break
      }
      case "teamMembers": {
        // Team members are created individually via API
        if (Array.isArray(value) && value.length > 0) {
          console.warn("[Storage] Bulk team member creation not supported. Use individual API calls.")
        }
        break
      }
      default:
        console.warn(`[Storage] setUserData for key "${key}" not implemented`)
    }
  } catch (error) {
    console.error(`[Storage] Error setting ${key}:`, error)
    throw error
  }
}

// Remove user data
export async function removeUserData(
  key: string,
  targetUserId?: string
): Promise<void> {
  const userId = targetUserId || getCurrentUserId()
  if (!userId) return

  try {
    // This is typically handled by delete API endpoints
    console.warn(`[Storage] removeUserData for key "${key}" should use delete API endpoints`)
  } catch (error) {
    console.error(`[Storage] Error removing ${key}:`, error)
    throw error
  }
}

// Get all data for a specific user (for super admin)
export async function getAllUserData(userId: string) {
  try {
    const [tickets, members] = await Promise.all([
      getUserData<any[]>("repairTickets", [], userId),
      getUserData<any[]>("teamMembers", [], userId),
    ])

    return {
      repairTickets: tickets,
      teamMembers: members,
      deletedTickets: [], // Deleted tickets are in database, not fetched here
      deletedMembers: [], // Deleted members are in database, not fetched here
    }
  } catch (error) {
    console.error("[Storage] Error fetching all user data:", error)
    return {
      repairTickets: [],
      teamMembers: [],
      deletedTickets: [],
      deletedMembers: [],
    }
  }
}
