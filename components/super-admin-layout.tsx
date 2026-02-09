"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X
} from "lucide-react"
import { usePathname } from "next/navigation"

export function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/users", label: "Users", icon: Users },
    { href: "/super-admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    { href: "/super-admin/payments", label: "Payments", icon: DollarSign },
    { href: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  ]

  const isActive = (href: string) => {
    if (href === "/super-admin") {
      return pathname === "/super-admin"
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="min-h-screen w-full relative bg-black">
      {/* Pearl Mist Background with Top Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(226, 232, 240, 0.12), transparent 60%), #000000",
        }}
      />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex relative z-10">
        {/* Sidebar */}
        <aside className={`fixed lg:static inset-y-0 left-0 z-[9999] w-72 bg-gradient-to-b from-gray-900/95 via-black/95 to-gray-900/95 border-r border-gray-800/50 min-h-screen p-6 shadow-2xl backdrop-blur-sm transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="flex flex-col h-full">
            {/* Logo/Header */}
            <div className="flex items-center justify-between mb-8">
              <Link href="/super-admin" className="flex items-center gap-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 p-2.5 rounded-xl shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <span className="text-white font-bold text-lg group-hover:text-blue-300 transition-colors duration-300">
                  Super Admin
                </span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30 shadow-lg"
                        : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-blue-400" : ""}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="mt-auto pt-6 border-t border-gray-800/50">
              <div className="px-4 py-3 mb-3">
                <p className="text-sm text-gray-400">Logged in as</p>
                <p className="text-white font-semibold">{user?.name || user?.email || "Super Admin"}</p>
              </div>
              <Button
                onClick={() => {
                  logout()
                  router.push("/login")
                }}
                variant="outline"
                className="w-full border-red-600/50 bg-red-900/20 text-red-400 hover:bg-red-900/40 hover:border-red-600 hover:text-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {/* Mobile Header */}
          <header className="lg:hidden sticky top-0 z-[9997] bg-gradient-to-r from-gray-900/95 via-black/95 to-gray-900/95 border-b border-gray-800/50 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-white hover:text-blue-400 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Link href="/super-admin" className="text-white font-bold text-lg">
                Super Admin
              </Link>
              <div className="w-6 h-6" /> {/* Spacer */}
            </div>
          </header>

          {/* Page Content */}
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
