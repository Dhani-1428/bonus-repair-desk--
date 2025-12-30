"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

export function RepairTicketList() {
  const router = useRouter()
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const { t } = useTranslation()

  useEffect(() => {
    const loadTickets = async () => {
      if (!user?.id) return
      
      try {
        // Load tickets from API instead of localStorage
        const response = await fetch(`/api/repairs?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          const ticketsArray = Array.isArray(data.tickets) ? data.tickets : []
          setTickets(ticketsArray.slice(0, 5))
        } else {
          console.error("[RepairTicketList] Failed to load tickets from API")
          setTickets([])
        }
      } catch (error) {
        console.error("[RepairTicketList] Error fetching tickets:", error)
        setTickets([])
      }
    }
    loadTickets()
  }, [user?.id])

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
        return "bg-purple-500 text-white border-2 border-purple-600 font-semibold"
      default:
        return "bg-gray-500 text-white border-2 border-gray-600 font-semibold"
    }
  }

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      if (!user?.id) {
        toast.error(t("error.userNotFound"))
        return
      }

      // Update via API
      const response = await fetch(`/api/repairs/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, status: newStatus }),
      })
      
      if (response.ok) {
        // Reload tickets from API
        const reloadResponse = await fetch(`/api/repairs?userId=${user.id}`)
        if (reloadResponse.ok) {
          const data = await reloadResponse.json()
          const ticketsArray = Array.isArray(data.tickets) ? data.tickets : []
          setTickets(ticketsArray.slice(0, 5))
          toast.success(t("success.statusUpdated") || "Status updated successfully")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || t("error.ticketStatusUpdateFailed"))
      }
    } catch (error: any) {
      console.error("[RepairTicketList] Error updating ticket status:", error)
      toast.error(error.message || t("error.ticketStatusUpdateFailed"))
    }
  }

  return (
    <Card className="shadow-xl border border-blue-200 bg-white">
      <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-xl p-6">
        <CardTitle className="text-2xl font-bold text-black flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center ring-2 ring-blue-200 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          {t("dashboard.recentDevicesInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-black">
        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-200">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-black text-lg font-medium">{t("dashboard.noRepairDevicesYet")}</p>
            <p className="text-sm text-black mt-2">{t("dashboard.createFirstDevice")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-50 border-b-2 border-blue-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.date")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.customer")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.contact")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.model")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.imei")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.service")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.status")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider border-r border-blue-200">{t("table.price")}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-black uppercase tracking-wider">{t("table.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-100">
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => {
                      router.push(`/tickets/${ticket.id}`)
                    }}
                    className="bg-white hover:bg-blue-50 transition-all cursor-pointer border-b border-blue-100"
                  >
                    <td className="px-4 py-3 text-sm text-black border-r border-blue-100">
                      <div className="flex flex-col gap-0.5">
                        <div className="leading-tight">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                        {(ticket.status === "DELIVERED" || ticket.status === "delivered") && ticket.deliveredDate && (
                          <div className="text-xs text-blue-600 font-semibold leading-tight">
                            Out: {new Date(ticket.deliveredDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-black border-r border-blue-100 whitespace-nowrap">
                      {ticket.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-black border-r border-blue-100 whitespace-nowrap">
                      {ticket.contact}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-black border-r border-blue-100 whitespace-nowrap">
                      {ticket.model}
                    </td>
                    <td className="px-4 py-3 text-sm text-black font-mono border-r border-blue-100 whitespace-nowrap">
                      {ticket.imeiNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-black border-r border-blue-100 max-w-xs truncate">
                      {(() => {
                        let services = ticket.serviceName || ""
                        if (ticket.selectedServices) {
                          try {
                            const servicesArray = typeof ticket.selectedServices === 'string' 
                              ? JSON.parse(ticket.selectedServices) 
                              : ticket.selectedServices
                            if (Array.isArray(servicesArray) && servicesArray.length > 0) {
                              services = servicesArray.join(", ")
                            }
                          } catch {
                            // Keep serviceName if parsing fails
                          }
                        }
                        return services || "-"
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm border-r border-blue-100 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={ticket.status?.toLowerCase() || "pending"}
                        onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                      >
                        <SelectTrigger className={`${getStatusColor(ticket.status)} text-xs px-2 py-1 h-auto border w-auto min-w-[140px] cursor-pointer font-semibold`}>
                          <SelectValue>
                            {ticket.status === "pending" || ticket.status === "PENDING" ? t("status.pending") :
                             ticket.status === "not_ok" || ticket.status === "NOT_OK" ? (t("status.notOk") || "Not OK") :
                             ticket.status === "completed" || ticket.status === "COMPLETED" ? t("status.completed") :
                             ticket.status === "delivered" || ticket.status === "DELIVERED" ? t("status.delivered") :
                             ticket.status?.replace("_", " ") || t("status.pending")}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-blue-200">
                          <SelectItem value="pending" className="text-black cursor-pointer hover:bg-blue-50">{t("status.pending")}</SelectItem>
                          <SelectItem value="not_ok" className="text-black cursor-pointer hover:bg-blue-50">{t("status.notOk") || "Not OK"}</SelectItem>
                          <SelectItem value="completed" className="text-black cursor-pointer hover:bg-blue-50">{t("status.completed")}</SelectItem>
                          <SelectItem value="delivered" className="text-black cursor-pointer hover:bg-blue-50">{t("status.delivered")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-black border-r border-blue-100 whitespace-nowrap">
                      €{ticket.price}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mx-auto hover:bg-blue-600 transition-colors shadow-md">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

