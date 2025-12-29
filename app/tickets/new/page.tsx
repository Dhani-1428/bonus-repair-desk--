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
      console.log(`[NewTicketPage] Loaded ${data.tickets?.length || 0} device(s) from API`)
      if (data.tickets) {
        console.log(`[NewTicketPage] Device details:`, data.tickets.map((t: any) => ({
          id: t.id,
          repairNumber: t.repairNumber,
          customerName: t.customerName,
          brand: t.brand,
          model: t.model
        })))
        setDevices(data.tickets)
      } else {
        console.warn("[NewTicketPage] No tickets in API response:", data)
        setDevices([])
      }
    } catch (error) {
      console.error("[NewTicketPage] Error loading devices:", error)
      setDevices([])
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
        return "text-yellow-700"
      case "in_progress":
        return "text-blue-700"
      case "completed":
        return "text-green-700"
      case "delivered":
        return "text-purple-700"
      default:
        return "text-black"
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
      receivedBy: ticket.receivedBy || "N/A",
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
      <div className="space-y-6 text-black">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-balance text-black">
            {t("page.newTicket.title")}
          </h1>
          <p className="text-black text-balance">
            {t("page.newTicket.subtitle")}
          </p>
        </div>

        {/* New Repair Device Form */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">{t("page.newTicket.title")}</h2>
          <NewRepairTicketForm />
        </div>

        {/* Devices Information Section */}
        <Card id="devices-information-section" className="shadow-xl border border-blue-200 bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl flex items-center gap-2 text-black">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                {t("page.tickets.title")}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDevices(!showDevices)}
                className="border-blue-300 bg-white text-black hover:bg-blue-50"
                data-show-devices-button
              >
                {showDevices ? t("common.hide") : t("common.show")} {t("page.tickets.title")} ({devices.length})
              </Button>
            </div>
          </CardHeader>
          {showDevices && (
            <CardContent className="p-6 text-black">
              {devices.length === 0 ? (
                <div className="text-center py-8 text-black">
                  <p>{t("dashboard.noDevicesRegistered")}</p>
                  <p className="text-sm mt-2">{t("dashboard.createNewTicketToStart")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {devices && devices.length > 0 ? (
                    devices.map((device, index) => {
                      console.log(`[NewTicketPage] Rendering device ${index + 1}:`, {
                        id: device.id,
                        repairNumber: device.repairNumber,
                        customerName: device.customerName,
                        brand: device.brand,
                        model: device.model
                      })
                      return (
                        <div
                          key={device.id || `device-${index}`}
                          className="border-2 border-blue-200 rounded-xl p-4 bg-white"
                        >
                          <div className="mb-3 pb-2 border-b border-blue-200">
                            <h3 className="text-lg font-semibold text-black">Device {index + 1}</h3>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            <div>
                              <p className="text-sm text-black">{t("ticket.repairNumber")}</p>
                              <p className="font-semibold text-black">{device.repairNumber || t("common.notAvailable")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">{t("form.customerName")}</p>
                              <p className="font-semibold text-black">{device.customerName || t("common.notAvailable")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">{t("form.receivedBy")}</p>
                              <p className="font-semibold text-black">{device.receivedBy || t("common.notAvailable")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">{t("ticket.clientNif")}</p>
                              <p className="font-semibold text-black">{device.clientId || t("common.notAvailable")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">{t("table.contact")}</p>
                              <p className="font-semibold text-black">{device.contact || t("common.notAvailable")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">{t("ticket.brandModel")}</p>
                              <p className="font-semibold text-black">{device.brand || t("common.notAvailable")} - {device.model || t("common.notAvailable")}</p>
                            </div>
                            <div>
                              <p className="text-sm text-black">{t("table.imei")}</p>
                              <p className="font-semibold text-black">{device.imeiNo || t("common.notAvailable")}</p>
                            </div>
                        <div>
                          <p className="text-sm text-black mb-2">{t("table.status")}</p>
                          <Select
                            value={device.status?.toLowerCase() || "pending"}
                            onValueChange={(value) => updateTicketStatus(device.id, value)}
                          >
                            <SelectTrigger className={`${getStatusColor(device.status)} bg-white border-blue-300 w-full font-semibold`}>
                              <SelectValue>
                                {device.status === "pending" || device.status === "PENDING" ? t("status.pending") :
                                 device.status === "in_progress" || device.status === "IN_PROGRESS" || device.status === "in-progress" ? t("status.in_progress") :
                                 device.status === "completed" || device.status === "COMPLETED" ? t("status.completed") :
                                 device.status === "delivered" || device.status === "DELIVERED" ? t("status.delivered") :
                                 device.status || t("status.pending")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-blue-200">
                              <SelectItem value="pending" className="text-black cursor-pointer hover:bg-blue-50">{t("status.pending")}</SelectItem>
                              <SelectItem value="in_progress" className="text-black cursor-pointer hover:bg-blue-50">{t("status.in_progress")}</SelectItem>
                              <SelectItem value="completed" className="text-black cursor-pointer hover:bg-blue-50">{t("status.completed")}</SelectItem>
                              <SelectItem value="delivered" className="text-black cursor-pointer hover:bg-blue-50">{t("status.delivered")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <p className="text-sm text-black">{t("table.price")}</p>
                          <p className="font-semibold text-black">€{device.price || "0.00"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-black">{t("ticket.created")}</p>
                          <p className="font-semibold text-xs text-black">
                            {device.createdAt ? new Date(device.createdAt).toLocaleDateString() : t("common.notAvailable")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-sm text-black mb-2">{t("ticket.service")} {Array.isArray(device.selectedServices) ? device.selectedServices.join(", ") : device.serviceName || t("common.notAvailable")}</p>
                        <p className="text-sm text-black">{t("ticket.problem")} {device.problem || t("common.notAvailable")}</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintReceipt(device)}
                          className="border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-600"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          {t("page.newTicket.print")}
                        </Button>
                        </div>
                      </div>
                    )
                    })
                  ) : (
                    <div className="text-center py-8 text-black">
                      <p>No devices found. Please add a device first.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}

