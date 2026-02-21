"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { getUserData } from "@/lib/storage"
import { printReceiptWithLanguageSelection } from "@/components/new-repair-ticket-form"

export default function DeviceDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [relatedDevicesCount, setRelatedDevicesCount] = useState(1)
  const [allDevicesForClientIdCount, setAllDevicesForClientIdCount] = useState(1)
  const printContentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadTicket = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        // Fetch all tickets for the user
        const response = await fetch(`/api/repairs?userId=${user.id}`)
        const data = await response.json()
        
        if (data.tickets) {
          const foundTicket = data.tickets.find((t: any) => t.id === params.id)
          
          if (foundTicket) {
            setTicket(foundTicket)
            
            // Normalize client ID for comparison (same logic as in printReceiptForTickets)
            const normalizeClientId = (id: string): string => {
              if (!id) return ""
              const match = id.match(/CLI-?(\d+)/i) || id.match(/(\d+)/)
              if (match) {
                const num = parseInt(match[1], 10)
                if (!isNaN(num) && num >= 1) {
                  return `CLI-${String(num).padStart(4, "0")}`
                }
              }
              return id.toUpperCase()
            }
            
            // Count related devices (same clientId and customerName and batchId)
            const relatedDevices = data.tickets.filter((t: any) => 
              t.clientId === foundTicket.clientId && 
              t.customerName === foundTicket.customerName &&
              (t.batchId === foundTicket.batchId || (!t.batchId && !foundTicket.batchId))
            )
            setRelatedDevicesCount(relatedDevices.length)
            
            // Count ALL devices with the same normalized clientId (regardless of customerName or batchId)
            if (foundTicket.clientId) {
              const normalizedClientId = normalizeClientId(foundTicket.clientId)
              const allDevicesForClientId = data.tickets.filter((t: any) => {
                if (!t.clientId) return false
                const normalizedTicketClientId = normalizeClientId(t.clientId)
                return normalizedTicketClientId === normalizedClientId
              })
              setAllDevicesForClientIdCount(allDevicesForClientId.length)
            } else {
              setAllDevicesForClientIdCount(1)
            }
          } else {
            router.push("/tickets")
          }
        } else {
          router.push("/tickets")
        }
      } catch (error) {
        console.error("Error loading ticket:", error)
        router.push("/tickets")
      } finally {
        setLoading(false)
      }
    }

    loadTicket()
  }, [params.id, router, user?.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700"
      case "in_progress":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
      case "completed":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700"
      case "delivered":
        return "bg-blue-500 dark:bg-blue-600 text-white border-2 border-blue-600 dark:border-blue-700 font-semibold"
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
    }
  }

  // Normalize ticket for printing
  const normalizeTicket = (t: any) => ({
    ...t,
    clientId: t.clientId || null,
    customerName: t.customerName || "N/A",
    contact: t.contact || "N/A",
    receivedBy: t.receivedBy || "N/A",
    imeiNo: t.imeiNo || "000000000000000",
    brand: t.brand || "N/A",
    model: t.model || "N/A",
    serialNo: t.serialNo || null,
    softwareVersion: t.softwareVersion || null,
    warranty: t.warranty || "Without Warranty",
    battery: t.battery ?? false,
    charger: t.charger ?? false,
    simCard: t.simCard ?? false,
    simTray: t.simTray ?? false,
    memoryCard: t.memoryCard ?? false,
    loanEquipment: t.loanEquipment ?? false,
    equipmentObs: t.equipmentObs || null,
    repairObs: t.repairObs || null,
    selectedServices: Array.isArray(t.selectedServices) ? t.selectedServices : (t.serviceName ? [t.serviceName] : []),
    condition: t.condition || null,
    problem: t.problem || "N/A",
    price: t.price || 0,
    budget: t.budget || null,
    repairNumber: t.repairNumber || "N/A",
    spu: t.spu || "N/A",
    createdAt: t.createdAt || new Date().toISOString(),
  })

  // Print single device receipt
  const handlePrintSingleDevice = () => {
    if (typeof window !== "undefined" && ticket) {
      const normalizedTicket = normalizeTicket(ticket)
      printReceiptWithLanguageSelection([normalizedTicket])
    }
  }

  // Print all devices in the group (same clientId, customerName, and batchId)
  const handlePrintAllDevices = async () => {
    if (typeof window !== "undefined" && ticket && user?.id) {
      try {
        // Fetch all tickets to find devices with the same clientId and customerName
        const response = await fetch(`/api/repairs?userId=${user.id}`)
        const data = await response.json()
        
        // Find all devices with the same clientId and customerName (devices added together)
        const sameClientDevices = (data.tickets || []).filter((t: any) => 
          t.clientId === ticket.clientId && 
          t.customerName === ticket.customerName &&
          (t.batchId === ticket.batchId || (!t.batchId && !ticket.batchId))
        )
        
        console.log(`[DeviceDetailPage] Printing receipt for ${sameClientDevices.length} device(s) with clientId: ${ticket.clientId}`)
        
        // Normalize all devices with the same client details
        const normalizedTickets = sameClientDevices.map((device: any) => normalizeTicket(device))
        
        printReceiptWithLanguageSelection(normalizedTickets)
      } catch (error) {
        console.error("[DeviceDetailPage] Error loading tickets for print:", error)
        // Fallback to printing just the current ticket
        const normalizedTicket = normalizeTicket(ticket)
        printReceiptWithLanguageSelection([normalizedTicket])
      }
    }
  }

  // Print ALL devices with the same client ID (normalized, regardless of customerName or batchId)
  const handlePrintAllDevicesForClientId = async () => {
    if (typeof window !== "undefined" && ticket && user?.id && ticket.clientId) {
      try {
        // Fetch all tickets
        const response = await fetch(`/api/repairs?userId=${user.id}`)
        const data = await response.json()
        
        // Normalize client ID for comparison (same logic as in printReceiptForTickets)
        const normalizeClientId = (id: string): string => {
          if (!id) return ""
          const match = id.match(/CLI-?(\d+)/i) || id.match(/(\d+)/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (!isNaN(num) && num >= 1) {
              return `CLI-${String(num).padStart(4, "0")}`
            }
          }
          return id.toUpperCase()
        }
        
        const normalizedClientId = normalizeClientId(ticket.clientId)
        
        // Find ALL devices with the same normalized client ID
        const allDevicesForClientId = (data.tickets || []).filter((t: any) => {
          if (!t.clientId) return false
          const normalizedTicketClientId = normalizeClientId(t.clientId)
          return normalizedTicketClientId === normalizedClientId
        })
        
        console.log(`[DeviceDetailPage] Printing receipt for ${allDevicesForClientId.length} device(s) with normalized clientId: ${normalizedClientId}`)
        
        // Normalize all devices
        const normalizedTickets = allDevicesForClientId.map((device: any) => normalizeTicket(device))
        
        printReceiptWithLanguageSelection(normalizedTickets)
      } catch (error) {
        console.error("[DeviceDetailPage] Error loading tickets for print all devices:", error)
        // Fallback to printing just the current ticket
        const normalizedTicket = normalizeTicket(ticket)
        printReceiptWithLanguageSelection([normalizedTicket])
      }
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-black dark:text-white">{t("common.loading")}</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black dark:text-white" ref={printContentRef}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-black dark:text-white">
              {t("page.tickets.title")}
            </h1>
            <p className="text-black dark:text-white text-balance">
              {t("page.tickets.subtitle")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Always show Print This Device button */}
            <Button variant="outline" onClick={handlePrintSingleDevice} className="border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-700 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 hover:border-blue-600 dark:hover:border-blue-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t("page.tickets.print")}
            </Button>
            
            {/* Show Print All Devices (same batch) if there are multiple devices in the same batch */}
            {relatedDevicesCount > 1 && (
              <Button variant="outline" onClick={handlePrintAllDevices} className="border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-700 text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-800 hover:border-green-600 dark:hover:border-green-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print All Devices ({relatedDevicesCount})
              </Button>
            )}
            
            {/* Show Print All Devices for Client ID if there are multiple devices with same client ID */}
            {allDevicesForClientIdCount > 1 && (
              <Button variant="outline" onClick={handlePrintAllDevicesForClientId} className="border-purple-500 bg-purple-50 dark:bg-purple-900 dark:border-purple-700 text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-800 hover:border-purple-600 dark:hover:border-purple-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print All Devices for Client ID ({allDevicesForClientIdCount})
              </Button>
            )}
          </div>
        </div>

        <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <CardHeader className="bg-blue-50 dark:bg-gray-800 border-b border-blue-200 dark:border-gray-700 rounded-t-lg px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-3 text-black dark:text-white">
                <div className="w-12 h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {ticket.customerName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-lg font-bold text-black dark:text-white">{ticket.customerName || t("common.notAvailable")}</div>
                  <div className="text-sm text-black dark:text-gray-300 font-normal">{t("ticket.repair")}{ticket.repairNumber || t("common.notAvailable")}</div>
            </div>
              </CardTitle>
              <Badge className={`${getStatusColor(ticket.status)} font-medium px-3 py-1`}>
                {ticket.status === "pending" || ticket.status === "PENDING" ? t("status.pending") :
                 ticket.status === "in_progress" || ticket.status === "IN_PROGRESS" ? t("status.in_progress") :
                 ticket.status === "completed" || ticket.status === "COMPLETED" ? t("status.completed") :
                 ticket.status === "delivered" || ticket.status === "DELIVERED" ? t("status.delivered") :
                 ticket.status?.replace("_", " ").toUpperCase() || t("status.pending")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3 uppercase tracking-wide">{t("ticket.customerInformation")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.clientNif")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">{ticket.clientId || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("form.customerName")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">{ticket.customerName || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("form.clientPhone")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">{ticket.contact || t("common.notAvailable")}</p>
                  </div>
            </div>
          </div>

              {/* Device Information */}
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3 uppercase tracking-wide">{t("ticket.deviceInformation")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("form.brand")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">{ticket.brand || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("form.model")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">{ticket.model || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("table.imei")}</Label>
                    <p className="text-sm text-black dark:text-gray-300 font-mono">{ticket.imeiNo || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.serialNumber")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">{ticket.serialNo || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.softwareVersion")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">{ticket.softwareVersion || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("form.warranty")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">
                      {ticket.warranty === "Warranty Until 30 days" || ticket.warranty === "Garantia até 30 dias" 
                        ? t("form.warrantyUntil30Days")
                        : ticket.warranty === "Without Warranty" || ticket.warranty === "Sem Garantia"
                        ? t("form.withoutWarranty")
                        : ticket.warranty || t("form.withoutWarranty")}
                    </p>
            </div>
            </div>
          </div>

              {/* Repair Details */}
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3 uppercase tracking-wide">{t("ticket.repairDetails")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.repairNumber")}</Label>
                    <p className="text-sm text-black dark:text-gray-300 font-semibold">{ticket.repairNumber || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.spu") || "SPU"}</Label>
                    <p className="text-sm text-black dark:text-gray-300 font-semibold">{ticket.spu || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.services")}</Label>
                    <p className="text-sm text-black dark:text-gray-300">
                      {Array.isArray(ticket.selectedServices) 
                        ? ticket.selectedServices.join(", ") 
                        : ticket.serviceName || t("common.notAvailable")}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.problemTechnicianNotes")}</Label>
                    <p className="text-sm text-black dark:text-gray-300 whitespace-pre-wrap">{ticket.problem || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-black dark:text-white">{t("form.condition")}</Label>
                    <p className="text-sm text-black dark:text-gray-300 whitespace-pre-wrap">{ticket.condition || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("table.price")}</Label>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">€{Number.parseFloat(ticket.price || 0).toFixed(2)}</p>
                  </div>
                </div>
          </div>

              {/* Equipment Check */}
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white mb-3 uppercase tracking-wide">{t("form.equipmentCheck")}</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.battery ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                    <span className="text-xs text-black dark:text-white">{t("form.battery")}:</span>
                    <span className="text-sm text-black dark:text-gray-300">{ticket.battery ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.charger ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                    <span className="text-xs text-black dark:text-white">{t("form.charger")}:</span>
                    <span className="text-sm text-black dark:text-gray-300">{ticket.charger ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.simCard ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                    <span className="text-xs text-black dark:text-white">{t("form.simCard")}:</span>
                    <span className="text-sm text-black dark:text-gray-300">{ticket.simCard ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.simTray ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                    <span className="text-xs text-black dark:text-white">{t("form.simTray")}:</span>
                    <span className="text-sm text-black dark:text-gray-300">{ticket.simTray ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.memoryCard ? "bg-green-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                    <span className="text-xs text-black dark:text-white">{t("form.memoryCard")}:</span>
                    <span className="text-sm text-black dark:text-gray-300">{ticket.memoryCard ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.waterDamaged ? "bg-red-500" : "bg-gray-400 dark:bg-gray-600"}`}></div>
                    <span className="text-xs text-black dark:text-white">{t("form.waterDamaged")}:</span>
                    <span className="text-sm text-black dark:text-gray-300">{ticket.waterDamaged ? t("common.yes") : t("common.no")}</span>
                  </div>
                </div>
          </div>

              {/* Observations */}
              {(ticket.equipmentObs || ticket.repairObs) && (
                <div>
                  <h3 className="text-sm font-semibold text-black dark:text-white mb-3 uppercase tracking-wide">{t("ticket.observations")}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {ticket.equipmentObs && (
                      <div className="space-y-1">
                        <Label className="text-xs text-black dark:text-white">{t("form.equipmentObservations")}</Label>
                        <p className="text-sm text-black dark:text-gray-300 whitespace-pre-wrap">{ticket.equipmentObs}</p>
                      </div>
                    )}
                    {ticket.repairObs && (
                      <div className="space-y-1">
                        <Label className="text-xs text-black dark:text-white">{t("form.repairObservations")}</Label>
                        <p className="text-sm text-black dark:text-gray-300 whitespace-pre-wrap">{ticket.repairObs}</p>
                      </div>
                    )}
          </div>
          </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-blue-200 dark:border-gray-700">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs text-black dark:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
                    <span>{t("ticket.created")}: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : t("common.notAvailable")}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black dark:text-white">{t("ticket.repairNumber")}</Label>
                    <p className="text-sm text-black dark:text-gray-300 font-semibold">{ticket.repairNumber || t("common.notAvailable")}</p>
                  </div>
                  {ticket.updatedAt && (
                    <div className="flex items-center gap-2 text-xs text-black dark:text-gray-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>{t("ticket.updated")}: {new Date(ticket.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
          </div>
        </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

