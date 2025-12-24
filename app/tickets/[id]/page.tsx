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
        return "bg-gray-700 text-white border border-gray-600"
      case "completed":
        return "bg-gray-800 text-white border border-gray-700"
      case "delivered":
        return "bg-gray-900 text-white border border-gray-800"
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200"
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined" && ticket) {
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
        selectedServices: ticket.selectedServices || (ticket.serviceName ? [ticket.serviceName] : []),
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
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-gray-600">{t("common.loading")}</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!ticket) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 text-white" ref={printContentRef}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-balance text-white">
              {t("page.tickets.title")}
            </h1>
            <p className="text-gray-300 text-balance">
              {t("page.tickets.subtitle")}
            </p>
          </div>
          <Button variant="outline" onClick={handlePrint} className="border-gray-700 bg-gray-900/50 text-white hover:bg-gray-800">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {t("page.tickets.print")}
          </Button>
        </div>

        <Card className="shadow-2xl border border-gray-800/50 bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-gray-800/50 rounded-t-lg px-6 py-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {ticket.customerName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-lg font-bold">{ticket.customerName || t("common.notAvailable")}</div>
                  <div className="text-sm text-gray-300 font-normal">{t("ticket.repair")}{ticket.repairNumber || t("common.notAvailable")}</div>
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
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("ticket.customerInformation")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("ticket.clientNif")}</Label>
                    <p className="text-sm text-white">{ticket.clientId || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("form.customerName")}</Label>
                    <p className="text-sm text-white">{ticket.customerName || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("form.clientPhone")}</Label>
                    <p className="text-sm text-white">{ticket.contact || t("common.notAvailable")}</p>
                  </div>
            </div>
          </div>

              {/* Device Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("ticket.deviceInformation")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("form.brand")}</Label>
                    <p className="text-sm text-white">{ticket.brand || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("form.model")}</Label>
                    <p className="text-sm text-white">{ticket.model || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("table.imei")}</Label>
                    <p className="text-sm text-white font-mono">{ticket.imeiNo || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("ticket.serialNumber")}</Label>
                    <p className="text-sm text-white">{ticket.serialNo || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("ticket.softwareVersion")}</Label>
                    <p className="text-sm text-white">{ticket.softwareVersion || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("form.warranty")}</Label>
                    <p className="text-sm text-white">{ticket.warranty || t("form.withoutWarranty")}</p>
            </div>
            </div>
          </div>

              {/* Repair Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("ticket.repairDetails")}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("ticket.repairNumber")}</Label>
                    <p className="text-sm text-white font-semibold">{ticket.repairNumber || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("ticket.spu") || "SPU"}</Label>
                    <p className="text-sm text-white font-semibold">{ticket.spu || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-gray-400">{t("ticket.services")}</Label>
                    <p className="text-sm text-white">
                      {Array.isArray(ticket.selectedServices) 
                        ? ticket.selectedServices.join(", ") 
                        : ticket.serviceName || t("common.notAvailable")}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-gray-400">{t("ticket.problemTechnicianNotes")}</Label>
                    <p className="text-sm text-white whitespace-pre-wrap">{ticket.problem || t("common.notAvailable")}</p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs text-gray-400">{t("form.condition")}</Label>
                    <p className="text-sm text-white whitespace-pre-wrap">{ticket.condition || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("table.price")}</Label>
                    <p className="text-lg font-bold text-blue-400">€{Number.parseFloat(ticket.price || 0).toFixed(2)}</p>
                  </div>
                </div>
          </div>

              {/* Equipment Check */}
              <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("form.equipmentCheck")}</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.battery ? "bg-green-500" : "bg-gray-600"}`}></div>
                    <span className="text-xs text-gray-400">{t("form.battery")}:</span>
                    <span className="text-sm text-white">{ticket.battery ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.charger ? "bg-green-500" : "bg-gray-600"}`}></div>
                    <span className="text-xs text-gray-400">{t("form.charger")}:</span>
                    <span className="text-sm text-white">{ticket.charger ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.simCard ? "bg-green-500" : "bg-gray-600"}`}></div>
                    <span className="text-xs text-gray-400">{t("form.simCard")}:</span>
                    <span className="text-sm text-white">{ticket.simCard ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.simTray ? "bg-green-500" : "bg-gray-600"}`}></div>
                    <span className="text-xs text-gray-400">{t("form.simTray")}:</span>
                    <span className="text-sm text-white">{ticket.simTray ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.memoryCard ? "bg-green-500" : "bg-gray-600"}`}></div>
                    <span className="text-xs text-gray-400">{t("form.memoryCard")}:</span>
                    <span className="text-sm text-white">{ticket.memoryCard ? t("common.yes") : t("common.no")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ticket.waterDamaged ? "bg-red-500" : "bg-gray-600"}`}></div>
                    <span className="text-xs text-gray-400">{t("form.waterDamaged")}:</span>
                    <span className="text-sm text-white">{ticket.waterDamaged ? t("common.yes") : t("common.no")}</span>
                  </div>
                </div>
          </div>

              {/* Observations */}
              {(ticket.equipmentObs || ticket.repairObs) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t("ticket.observations")}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {ticket.equipmentObs && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">{t("form.equipmentObservations")}</Label>
                        <p className="text-sm text-white whitespace-pre-wrap">{ticket.equipmentObs}</p>
                      </div>
                    )}
                    {ticket.repairObs && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">{t("form.repairObservations")}</Label>
                        <p className="text-sm text-white whitespace-pre-wrap">{ticket.repairObs}</p>
                      </div>
                    )}
          </div>
          </div>
              )}

              {/* Timestamps */}
              <div className="pt-4 border-t border-gray-800">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
                    <span>{t("ticket.created")}: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : t("common.notAvailable")}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-400">{t("ticket.repairNumber")}</Label>
                    <p className="text-sm text-white font-semibold">{ticket.repairNumber || t("common.notAvailable")}</p>
                  </div>
                  {ticket.updatedAt && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
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

