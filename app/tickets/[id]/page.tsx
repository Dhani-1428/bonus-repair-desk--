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
        return "bg-yellow-100 text-yellow-800 border border-yellow-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border border-green-200"
      case "delivered":
        return "bg-purple-100 text-purple-800 border border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const handlePrint = async () => {
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
        
        printReceiptWithLanguageSelection(normalizedTickets)
      } catch (error) {
        console.error("[DeviceDetailPage] Error loading tickets for print:", error)
        // Fallback to printing just the current ticket
        const normalizedTicket = {
          ...ticket,
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
          selectedServices: Array.isArray(ticket.selectedServices) ? ticket.selectedServices : (ticket.serviceName ? [ticket.serviceName] : []),
          condition: ticket.condition || null,
          problem: ticket.problem || "N/A",
          price: ticket.price || 0,
          budget: ticket.budget || null,
          repairNumber: ticket.repairNumber || "N/A",
          spu: ticket.spu || "N/A",
          createdAt: ticket.createdAt || new Date().toISOString(),
        }
        printReceiptWithLanguageSelection([normalizedTicket])
      }
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-black">{t("common.loading")}</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-black" ref={printContentRef}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-black">
              {t("page.tickets.title")}
            </h1>
            <p className="text-black text-balance">
              {t("page.tickets.subtitle")}
            </p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="border-blue-300 bg-white text-black hover:bg-blue-50">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t("page.tickets.print")}
          </Button>
        </div>

        <Card className="shadow-xl border border-blue-200 bg-white">
          <CardHeader className="bg-blue-50 border-b border-blue-200 rounded-t-lg px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-3 text-black">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {ticket.customerName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-lg font-bold text-black">{ticket.customerName || t("common.notAvailable")}</div>
                  <div className="text-sm text-black font-normal">{t("ticket.repair")}{ticket.repairNumber || t("common.notAvailable")}</div>
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
                <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">{t("ticket.customerInformation")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("ticket.clientNif")}</Label>
                    <p className="text-sm text-black">{ticket.clientId || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("form.customerName")}</Label>
                    <p className="text-sm text-black">{ticket.customerName || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("form.clientPhone")}</Label>
                    <p className="text-sm text-black">{ticket.contact || t("common.notAvailable")}</p>
                  </div>
            </div>
          </div>

              {/* Device Information */}
              <div>
                <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">{t("ticket.deviceInformation")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("form.brand")}</Label>
                    <p className="text-sm text-black">{ticket.brand || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("form.model")}</Label>
                    <p className="text-sm text-black">{ticket.model || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("table.imei")}</Label>
                    <p className="text-sm text-black font-mono">{ticket.imeiNo || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("ticket.serialNumber")}</Label>
                    <p className="text-sm text-black">{ticket.serialNo || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("ticket.softwareVersion")}</Label>
                    <p className="text-sm text-black">{ticket.softwareVersion || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("form.warranty")}</Label>
                    <p className="text-sm text-black">
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
                <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">{t("ticket.repairDetails")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("ticket.repairNumber")}</Label>
                    <p className="text-sm text-black font-semibold">{ticket.repairNumber || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("ticket.spu") || "SPU"}</Label>
                    <p className="text-sm text-black font-semibold">{ticket.spu || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-black">{t("ticket.services")}</Label>
                    <p className="text-sm text-black">
                      {Array.isArray(ticket.selectedServices) 
                        ? ticket.selectedServices.join(", ") 
                        : ticket.serviceName || t("common.notAvailable")}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-black">{t("ticket.problemTechnicianNotes")}</Label>
                    <p className="text-sm text-black whitespace-pre-wrap">{ticket.problem || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-black">{t("form.condition")}</Label>
                    <p className="text-sm text-black whitespace-pre-wrap">{ticket.condition || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("table.price")}</Label>
                    <p className="text-lg font-bold text-blue-600">€{Number.parseFloat(ticket.price || 0).toFixed(2)}</p>
                  </div>
                </div>
          </div>

              {/* Equipment Check */}
              <div>
                <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">{t("form.equipmentCheck")}</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.battery ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span className="text-xs text-black">{t("form.battery")}:</span>
                    <span className="text-sm text-black">{ticket.battery ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.charger ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span className="text-xs text-black">{t("form.charger")}:</span>
                    <span className="text-sm text-black">{ticket.charger ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.simCard ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span className="text-xs text-black">{t("form.simCard")}:</span>
                    <span className="text-sm text-black">{ticket.simCard ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.simTray ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span className="text-xs text-black">{t("form.simTray")}:</span>
                    <span className="text-sm text-black">{ticket.simTray ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.memoryCard ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span className="text-xs text-black">{t("form.memoryCard")}:</span>
                    <span className="text-sm text-black">{ticket.memoryCard ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.waterDamaged ? "bg-red-500" : "bg-gray-400"}`}></div>
                    <span className="text-xs text-black">{t("form.waterDamaged")}:</span>
                    <span className="text-sm text-black">{ticket.waterDamaged ? t("common.yes") : t("common.no")}</span>
                  </div>
                </div>
          </div>

              {/* Observations */}
              {(ticket.equipmentObs || ticket.repairObs) && (
                <div>
                  <h3 className="text-sm font-semibold text-black mb-3 uppercase tracking-wide">{t("ticket.observations")}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {ticket.equipmentObs && (
                      <div className="space-y-1">
                        <Label className="text-xs text-black">{t("form.equipmentObservations")}</Label>
                        <p className="text-sm text-black whitespace-pre-wrap">{ticket.equipmentObs}</p>
                      </div>
                    )}
                    {ticket.repairObs && (
                      <div className="space-y-1">
                        <Label className="text-xs text-black">{t("form.repairObservations")}</Label>
                        <p className="text-sm text-black whitespace-pre-wrap">{ticket.repairObs}</p>
                      </div>
                    )}
          </div>
          </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-blue-200">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs text-black">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
                    <span>{t("ticket.created")}: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : t("common.notAvailable")}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-black">{t("ticket.repairNumber")}</Label>
                    <p className="text-sm text-black font-semibold">{ticket.repairNumber || t("common.notAvailable")}</p>
                  </div>
                  {ticket.updatedAt && (
                    <div className="flex items-center gap-2 text-xs text-black">
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

