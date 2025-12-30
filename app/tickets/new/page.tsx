"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { NewRepairTicketForm, printReceiptWithLanguageSelection } from "@/components/new-repair-ticket-form"
import { useTranslation } from "@/components/language-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

  useEffect(() => {
    loadDevices()
    // Refresh devices list every 2 seconds to catch new entries
    const interval = setInterval(loadDevices, 2000)
    return () => clearInterval(interval)
  }, [user?.id])

  const handlePrintReceipt = (ticket: any) => {
    // Find all devices with the same clientId and customerName (devices added together)
    const sameClientDevices = devices.filter((device: any) => 
      device.clientId === ticket.clientId && 
      device.customerName === ticket.customerName
    )
    
    console.log(`[NewTicketPage] Printing receipt for ${sameClientDevices.length} device(s) with clientId: ${ticket.clientId}`)
    
    // Normalize all devices with the same client details
    const normalizedTickets = sameClientDevices.map((device: any) => ({
      ...device,
      // Ensure all fields exist with defaults if missing
      clientId: device.clientId || null,
      customerName: device.customerName || "N/A",
      contact: device.contact || "N/A",
      receivedBy: device.receivedBy || "N/A",
      imeiNo: device.imeiNo || "000000000000000",
      brand: device.brand || "N/A",
      model: device.model || "N/A",
      serialNo: device.serialNo || null,
      softwareVersion: device.softwareVersion || null,
      warranty: device.warranty || "Without Warranty",
      battery: device.battery ?? false,
      charger: device.charger ?? false,
      simCard: device.simCard ?? false,
      memoryCard: device.memoryCard ?? false,
      loanEquipment: device.loanEquipment ?? false,
      equipmentObs: device.equipmentObs || null,
      repairObs: device.repairObs || null,
      selectedServices: Array.isArray(device.selectedServices) ? device.selectedServices : (device.serviceName ? [device.serviceName] : []),
      condition: device.condition || null,
      problem: device.problem || "N/A",
      price: device.price || 0,
      budget: device.budget || null,
      repairNumber: device.repairNumber || "N/A",
      spu: device.spu || "N/A",
      createdAt: device.createdAt || new Date().toISOString(),
    }))
    
    console.log(`[NewTicketPage] Normalized tickets:`, normalizedTickets.map((t: any) => ({
      repairNumber: t.repairNumber,
      brand: t.brand,
      model: t.model,
      customerName: t.customerName
    })))
    
    // Use the wrapper function that shows language selection dialog first
    // Pass all devices with the same client details so they print together
    printReceiptWithLanguageSelection(normalizedTickets)
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
        <Card id="devices-information-section" className="shadow-xl border-2 border-blue-200 bg-white">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-2 border-blue-300 rounded-t-lg px-6 py-4 shadow-sm">
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
                <div className="space-y-6">
                  {devices && devices.length > 0 ? (() => {
                    // Group devices by batchId if available, otherwise by clientId and customerName (same repair/customer)
                    const groupedDevices: { [key: string]: any[] } = {}
                    devices.forEach((device: any) => {
                      // Use batchId if available, otherwise use clientId and customerName
                      const key = device.batchId || `${device.clientId || ''}_${device.customerName || ''}`
                      if (!groupedDevices[key]) {
                        groupedDevices[key] = []
                      }
                      groupedDevices[key].push(device)
                    })
                    
                    console.log(`[NewTicketPage] Grouped ${devices.length} device(s) into ${Object.keys(groupedDevices).length} repair group(s)`)
                    
                    // Sort groups by creation date (most recent first)
                    const sortedGroups = Object.values(groupedDevices).sort((a, b) => {
                      const dateA = new Date(a[0]?.createdAt || 0).getTime()
                      const dateB = new Date(b[0]?.createdAt || 0).getTime()
                      return dateB - dateA
                    })
                    
                    return sortedGroups.map((deviceGroup, groupIndex) => {
                      const firstDevice = deviceGroup[0]
                      const repairNumber = firstDevice.repairNumber || `Repair-${groupIndex + 1}`
                      
                      return (
                        <div
                          key={`repair-${firstDevice.clientId}-${firstDevice.customerName}-${groupIndex}`}
                          className="border-2 border-blue-300 rounded-xl p-6 bg-white shadow-sm"
                        >
                          {/* Customer/Repair Header */}
                          <div className="mb-4 pb-3 border-b-2 border-blue-300">
                            <div className="flex items-center justify-between mb-2">
                              <h2 className="text-xl font-bold text-black">
                                {t("ticket.repairNumber")}: {repairNumber}
                              </h2>
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                                {deviceGroup.length} {deviceGroup.length === 1 ? t("search.results.device") : t("search.results.devices")}
                              </Badge>
                            </div>
                            <div className="grid gap-2 md:grid-cols-3 text-sm">
                              <div>
                                <span className="text-black font-semibold">{t("form.customerName")}:</span>
                                <span className="text-black ml-2">{firstDevice.customerName || t("common.notAvailable")}</span>
                              </div>
                              <div>
                                <span className="text-black font-semibold">{t("table.contact")}:</span>
                                <span className="text-black ml-2">{firstDevice.contact || t("common.notAvailable")}</span>
                              </div>
                              <div>
                                <span className="text-black font-semibold">{t("ticket.clientNif")}:</span>
                                <span className="text-black ml-2">{firstDevice.clientId || t("common.notAvailable")}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Devices List */}
                          <div className="space-y-3">
                            {deviceGroup.map((device, deviceIndex) => {
                              console.log(`[NewTicketPage] Rendering Device ${deviceIndex + 1} of repair ${repairNumber}:`, {
                                id: device.id,
                                repairNumber: device.repairNumber,
                                brand: device.brand,
                                model: device.model
                              })
                              return (
                                <div
                                  key={device.id || `device-${deviceIndex}`}
                                  className="border border-blue-200 rounded-lg p-4 bg-blue-50/30"
                                >
                                  <div className="mb-3 pb-2 border-b border-blue-200">
                                    <h3 className="text-lg font-semibold text-black">
                                      Device {deviceIndex + 1}
                                    </h3>
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
                            <SelectTrigger className={`${getStatusColor(device.status)} w-full !bg-opacity-100`} style={{ backgroundColor: device.status?.toLowerCase() === 'pending' ? '#eab308' : device.status?.toLowerCase() === 'not_ok' ? '#ef4444' : device.status?.toLowerCase() === 'completed' ? '#22c55e' : device.status?.toLowerCase() === 'delivered' ? '#3b82f6' : '#6b7280', color: 'white', borderColor: device.status?.toLowerCase() === 'pending' ? '#ca8a04' : device.status?.toLowerCase() === 'not_ok' ? '#dc2626' : device.status?.toLowerCase() === 'completed' ? '#16a34a' : device.status?.toLowerCase() === 'delivered' ? '#2563eb' : '#4b5563' }}>
                              <SelectValue>
                                {device.status === "pending" || device.status === "PENDING" ? t("status.pending") :
                                 device.status === "not_ok" || device.status === "NOT_OK" ? (t("status.notOk") || "Not OK") :
                                 device.status === "completed" || device.status === "COMPLETED" ? t("status.completed") :
                                 device.status === "delivered" || device.status === "DELIVERED" ? t("status.delivered") :
                                 device.status || t("status.pending")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-blue-200">
                              <SelectItem value="pending" className="text-black cursor-pointer hover:bg-blue-50">{t("status.pending")}</SelectItem>
                              <SelectItem value="not_ok" className="text-black cursor-pointer hover:bg-blue-50">{t("status.notOk") || "Not OK"}</SelectItem>
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
                                    <p className="text-sm text-black mb-2">{t("ticket.service")} {(() => {
                                      if (Array.isArray(device.selectedServices) && device.selectedServices.length > 0) {
                                        return device.selectedServices.join(", ")
                                      }
                                      if (device.selectedServices && typeof device.selectedServices === 'string') {
                                        try {
                                          const parsed = JSON.parse(device.selectedServices)
                                          if (Array.isArray(parsed) && parsed.length > 0) {
                                            return parsed.join(", ")
                                          }
                                        } catch {}
                                      }
                                      return device.serviceName || "-"
                                    })()}</p>
                                    <p className="text-sm text-black">{t("ticket.problem")} {device.problem || t("common.notAvailable")}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Print Button for this device group */}
                          <div className="mt-4 pt-3 border-t border-blue-200">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrintReceipt(firstDevice)}
                              className="border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-600"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              {t("page.newTicket.print")} ({deviceGroup.length} {deviceGroup.length === 1 ? t("search.results.device") : t("search.results.devices")})
                            </Button>
                          </div>
                        </div>
                      )
                    })
                  })() : (
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

