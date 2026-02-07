"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { getUserData, setUserData } from "@/lib/storage"
import { useTranslation } from "@/components/language-provider"

export function TrashDevices() {
  const { t } = useTranslation()
  const [deletedTickets, setDeletedTickets] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    const loadDeletedItems = async () => {
      try {
        const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null
        if (!userData) {
          setDeletedTickets([])
          return
        }

        const user = JSON.parse(userData)
        const userId = user?.id

        if (!userId) {
          setDeletedTickets([])
          return
        }

        // Fetch deleted tickets from API
        try {
          const response = await fetch(`/api/repairs?userId=${userId}&deleted=true`)
          if (response.ok) {
            const data = await response.json()
            const tickets = data.tickets || []
            // Add deletedAt timestamp if not present
            const ticketsWithDeletedAt = tickets.map((ticket: any) => ({
              ...ticket,
              deletedAt: ticket.deletedAt || ticket.createdAt
            }))
            const sortedTickets = ticketsWithDeletedAt.sort((a: any, b: any) => 
              new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()
            )
            setDeletedTickets(sortedTickets)
          } else {
            console.error("Failed to fetch deleted tickets:", response.statusText)
            setDeletedTickets([])
          }
        } catch (error) {
          console.error("Error fetching deleted tickets:", error)
          setDeletedTickets([])
        }
      } catch (error) {
        console.error("Error loading deleted items:", error)
        setDeletedTickets([])
      }
    }

    loadDeletedItems()
    const interval = setInterval(loadDeletedItems, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleRestoreDevice = async (ticketId: string) => {
    const ticketToRestore = deletedTickets.find((t: any) => String(t.id) === String(ticketId))
    if (!ticketToRestore) return

    try {
      const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null
      if (!userData) {
        toast.error(t("error.userNotFound"))
        return
      }

      const user = JSON.parse(userData)
      const userId = user?.id

      if (!userId) {
        toast.error(t("error.userNotFound"))
        return
      }

      // Restore via API - POST to create the ticket again
      const { deletedAt, ...ticketWithoutDeletedDate } = ticketToRestore
      const response = await fetch("/api/repairs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketWithoutDeletedDate),
      })

      if (!response.ok) {
        throw new Error("Failed to restore device")
      }

      // Delete from deleted tickets table via API
      const deleteResponse = await fetch(`/api/repairs/${ticketId}?userId=${userId}&deleted=true`, {
        method: "DELETE",
      })

      if (!deleteResponse.ok) {
        console.warn("Failed to remove from deleted tickets table, but ticket was restored")
      }

      // Update local state
      setDeletedTickets(prev => prev.filter((t: any) => String(t.id) !== String(ticketId)))

      toast.success(t("trash.deviceRestored"))
    } catch (error) {
      console.error("Error restoring device:", error)
      toast.error(t("trash.deviceRestoreFailed"))
    }
  }


  const handlePermanentDelete = async (ticketId: string, customerName: string) => {
    if (typeof window === "undefined") return
    
    const confirmed = window.confirm(
      t("trash.confirmPermanentDelete").replace("{name}", customerName)
    )
    if (!confirmed) return

    try {
      const userData = typeof window !== "undefined" ? localStorage.getItem("user") : null
      if (!userData) {
        toast.error(t("error.userNotFound"))
        return
      }

      const user = JSON.parse(userData)
      const userId = user?.id

      if (!userId) {
        toast.error(t("error.userNotFound"))
        return
      }

      // Permanently delete from database
      const response = await fetch(`/api/repairs/${ticketId}?userId=${userId}&deleted=true`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to permanently delete device")
      }

      // Update local state
      setDeletedTickets(prev => prev.filter((t: any) => String(t.id) !== String(ticketId)))
      toast.success(t("trash.devicePermanentlyDeleted"))
    } catch (error) {
      console.error("Error deleting device:", error)
      toast.error(t("trash.deviceDeleteFailed"))
    }
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || ""
    switch (normalizedStatus) {
      case "pending":
        return "bg-yellow-500 text-white border-2 border-yellow-600 font-semibold"
      case "not_ok":
        return "bg-red-500 text-white border-2 border-red-600 font-semibold"
      case "completed":
        return "bg-green-500 text-white border-2 border-green-600 font-semibold"
      case "delivered":
        return "bg-blue-500 text-white border-2 border-blue-600 font-semibold"
      default:
        return "bg-gray-500 text-white border-2 border-gray-600 font-semibold"
    }
  }


  return (
    <div className="space-y-6">
          {deletedTickets.length > 0 ? (
            <Card className="shadow-xl border border-blue-200 bg-white">
              <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-2 text-black">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t("trash.deletedDevices")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-black">
                <div className="space-y-4">
                  {deletedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border-2 border-blue-200 rounded-xl p-6 space-y-4 bg-white hover:shadow-lg transition-all hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                              {ticket.customerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-xl text-black">{ticket.customerName}</h3>
                              <Badge className={`${getStatusColor(ticket.status)} font-medium px-2.5 py-0.5 mt-1`} style={{ backgroundColor: ticket.status?.toLowerCase() === 'pending' ? '#eab308' : ticket.status?.toLowerCase() === 'not_ok' ? '#ef4444' : ticket.status?.toLowerCase() === 'completed' ? '#22c55e' : ticket.status?.toLowerCase() === 'delivered' ? '#3b82f6' : '#6b7280', color: 'white', borderColor: ticket.status?.toLowerCase() === 'pending' ? '#ca8a04' : ticket.status?.toLowerCase() === 'not_ok' ? '#dc2626' : ticket.status?.toLowerCase() === 'completed' ? '#16a34a' : ticket.status?.toLowerCase() === 'delivered' ? '#2563eb' : '#4b5563' }}>
                                {ticket.status.replace("_", " ").toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2 text-sm mt-4">
                            {ticket.clientId && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                </svg>
                                <span className="text-black">{t("table.clientId") || "Client ID"}</span>
                                <span className="font-medium text-black">{ticket.clientId}</span>
                              </div>
                            )}
                            {ticket.contact && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-black">{t("trash.contact")}</span>
                                <span className="font-medium text-black">{ticket.contact}</span>
                              </div>
                            )}
                            {ticket.brand && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                                <span className="text-black">{t("table.brand") || "Brand"}</span>
                                <span className="font-medium text-black">{ticket.brand}</span>
                              </div>
                            )}
                            {ticket.model && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-black">{t("trash.model")}</span>
                                <span className="font-medium text-black">{ticket.model}</span>
                              </div>
                            )}
                            {ticket.imeiNo && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                </svg>
                                <span className="text-black">{t("trash.imei")}</span>
                                <span className="font-medium text-black">{ticket.imeiNo}</span>
                              </div>
                            )}
                            {ticket.serialNo && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20h10M7 20V4m0 16a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2H7z" />
                                </svg>
                                <span className="text-black">{t("table.serialNo") || "Serial No"}</span>
                                <span className="font-medium text-black">{ticket.serialNo}</span>
                              </div>
                            )}
                            {ticket.receivedBy && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-black">{t("table.receivedBy") || "Received By"}</span>
                                <span className="font-medium text-black">{ticket.receivedBy}</span>
                              </div>
                            )}
                            {ticket.repairNumber && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-black">{t("table.repairNumber") || "Repair Number"}</span>
                                <span className="font-medium text-black">{ticket.repairNumber}</span>
                              </div>
                            )}
                            {ticket.serviceName && (
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-black">{t("trash.service")}</span>
                                <span className="font-medium text-black">{ticket.serviceName}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-black">
                              <span className="text-black font-medium">{t("trash.problem")}</span>
                              <span className="ml-2">{ticket.problem}</span>
                            </p>
                          </div>
                          <p className="text-xs text-black mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t("trash.deletedOn")} {ticket.deletedAt ? new Date(ticket.deletedAt).toLocaleString() : "Unknown"}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-xl border-2 border-blue-300">
                            {ticket.budget ? (
                              <>
                                <p className="font-bold text-2xl text-white">€{Number.parseFloat(ticket.budget || 0).toFixed(2)}</p>
                                <p className="text-xs text-white mt-1 opacity-90">Budget</p>
                              </>
                            ) : ticket.price ? (
                              <>
                                <p className="font-bold text-2xl text-white">€{Number.parseFloat(ticket.price || 0).toFixed(2)}</p>
                                <p className="text-xs text-white mt-1 opacity-90">Price</p>
                              </>
                            ) : null}
                            <p className="text-xs text-white mt-1 flex items-center gap-1 justify-end">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-blue-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreDevice(ticket.id)}
                          className="hover:bg-blue-50 border-blue-300 text-black"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {t("trash.restore")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermanentDelete(ticket.id, ticket.customerName)}
                          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-black border-blue-300"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {t("trash.deletePermanently")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-xl border border-blue-200 bg-white">
              <CardContent className="p-12">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-black mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-black text-lg">{t("trash.noDeletedDevices")}</p>
                  <p className="text-sm text-black mt-2">{t("trash.deletedDevicesWillAppear")}</p>
                </div>
              </CardContent>
            </Card>
          )}
    </div>
  )
}

