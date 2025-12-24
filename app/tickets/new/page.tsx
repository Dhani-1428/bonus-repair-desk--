"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { NewRepairTicketForm, printReceiptWithLanguageSelection } from "@/components/new-repair-ticket-form"
import { useTranslation } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function NewTicketPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [devices, setDevices] = useState<any[]>([])
  const [showDevices, setShowDevices] = useState(false)

  const loadDevices = async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`/api/repairs?userId=${user.id}`)
      const data = await response.json()
      if (data.tickets) {
        setDevices(data.tickets)
      }
    } catch (error) {
      console.error("Error loading devices:", error)
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
        // Reload devices
        await loadDevices()
        toast.success(t("success.statusUpdated") || "Status updated successfully")
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || t("error.ticketStatusUpdateFailed"))
      }
    } catch (error: any) {
      console.error("[NewTicketPage] Error updating ticket status:", error)
      toast.error(error.message || t("error.ticketStatusUpdateFailed"))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "text-yellow-200"
      case "in_progress":
        return "text-blue-200"
      case "completed":
        return "text-green-200"
      case "delivered":
        return "text-purple-200"
      default:
        return "text-gray-200"
    }
  }

  useEffect(() => {
    loadDevices()
    // Refresh devices list every 2 seconds to catch new entries
    const interval = setInterval(loadDevices, 2000)
    return () => clearInterval(interval)
  }, [user?.id])

  const handlePrintReceipt = (ticket: any) => {
    // Ensure all required fields are present and use the exported print function
    // Normalize the ticket data to match the expected structure
    const normalizedTicket = {
      ...ticket,
      // Ensure all fields exist with defaults if missing
      clientId: ticket.clientId || null,
      customerName: ticket.customerName || "N/A",
      contact: ticket.contact || "N/A",
      imeiNo: ticket.imeiNo || "000000000000000",
      brand: ticket.brand || "N/A",
      model: ticket.model || "N/A",
      serialNo: ticket.serialNo || null,
      softwareVersion: ticket.softwareVersion || null,
      warranty: ticket.warranty || "Without Warranty",
      battery: ticket.battery ?? false,
      charger: ticket.charger ?? false,
      simCard: ticket.simCard ?? false,
      memoryCard: ticket.memoryCard ?? false,
      loanEquipment: ticket.loanEquipment ?? false,
      equipmentObs: ticket.equipmentObs || null,
      repairObs: ticket.repairObs || null,
      selectedServices: ticket.selectedServices || ticket.serviceName ? [ticket.serviceName] : [],
      condition: ticket.condition || null,
      problem: ticket.problem || "N/A",
      price: ticket.price || 0,
      repairNumber: ticket.repairNumber || "N/A",
      spu: ticket.spu || "N/A",
      createdAt: ticket.createdAt || new Date().toISOString(),
    }
    // Use the wrapper function that shows language selection dialog first
    printReceiptWithLanguageSelection([normalizedTicket])
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance text-white">
            {t("page.newTicket.title")}
          </h1>
          <p className="text-gray-300 text-balance">
            {t("page.newTicket.subtitle")}
          </p>
        </div>

        {/* New Repair Device Form */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">{t("page.newTicket.title")}</h2>
          <NewRepairTicketForm />
        </div>

        {/* Devices Information Section */}
        <Card id="devices-information-section" className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2 text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                {t("page.tickets.title")}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDevices(!showDevices)}
                className="border-gray-700 bg-gray-900/50 text-white hover:bg-gray-800"
                data-show-devices-button
              >
                {showDevices ? t("common.hide") : t("common.show")} {t("page.tickets.title")} ({devices.length})
              </Button>
            </div>
          </CardHeader>
          {showDevices && (
            <CardContent className="p-6 text-white">
              {devices.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>{t("dashboard.noDevicesRegistered")}</p>
                  <p className="text-sm mt-2">{t("dashboard.createNewTicketToStart")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices.map((device, index) => (
                    <div
                      key={device.id || index}
                      className="border-2 border-gray-800/50 rounded-xl p-4 bg-gradient-to-br from-gray-900/50 to-black/50"
                    >
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-sm text-gray-400">{t("ticket.repairNumber")}</p>
                          <p className="font-semibold">{device.repairNumber || t("common.notAvailable")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("form.customerName")}</p>
                          <p className="font-semibold">{device.customerName || t("common.notAvailable")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("ticket.clientNif")}</p>
                          <p className="font-semibold">{device.clientId || t("common.notAvailable")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("table.contact")}</p>
                          <p className="font-semibold">{device.contact || t("common.notAvailable")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("ticket.brandModel")}</p>
                          <p className="font-semibold">{device.brand || t("common.notAvailable")} - {device.model || t("common.notAvailable")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("table.imei")}</p>
                          <p className="font-semibold">{device.imeiNo || t("common.notAvailable")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">{t("table.status")}</p>
                          <Select
                            value={device.status?.toLowerCase() || "pending"}
                            onValueChange={(value) => updateTicketStatus(device.id, value)}
                          >
                            <SelectTrigger className={`${getStatusColor(device.status)} bg-gray-800/50 border-gray-700 w-full font-semibold`}>
                              <SelectValue>
                                {device.status === "pending" || device.status === "PENDING" ? t("status.pending") :
                                 device.status === "in_progress" || device.status === "IN_PROGRESS" || device.status === "in-progress" ? t("status.in_progress") :
                                 device.status === "completed" || device.status === "COMPLETED" ? t("status.completed") :
                                 device.status === "delivered" || device.status === "DELIVERED" ? t("status.delivered") :
                                 device.status || t("status.pending")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                              <SelectItem value="pending" className="text-white cursor-pointer hover:bg-gray-800">{t("status.pending")}</SelectItem>
                              <SelectItem value="in_progress" className="text-white cursor-pointer hover:bg-gray-800">{t("status.in_progress")}</SelectItem>
                              <SelectItem value="completed" className="text-white cursor-pointer hover:bg-gray-800">{t("status.completed")}</SelectItem>
                              <SelectItem value="delivered" className="text-white cursor-pointer hover:bg-gray-800">{t("status.delivered")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("table.price")}</p>
                          <p className="font-semibold">€{device.price || "0.00"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">{t("ticket.created")}</p>
                          <p className="font-semibold text-xs">
                            {device.createdAt ? new Date(device.createdAt).toLocaleDateString() : t("common.notAvailable")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <p className="text-sm text-gray-400 mb-2">{t("ticket.service")} {Array.isArray(device.selectedServices) ? device.selectedServices.join(", ") : device.serviceName || t("common.notAvailable")}</p>
                        <p className="text-sm text-gray-400">{t("ticket.problem")} {device.problem || t("common.notAvailable")}</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReceipt(device)}
                          className="border-blue-600/50 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 hover:border-blue-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          {t("page.newTicket.print")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

