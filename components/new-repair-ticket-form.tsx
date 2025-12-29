"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTranslation } from "@/components/language-provider"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { getUserData, setUserData, getCurrentUser } from "@/lib/storage"

interface DeviceFormData {
  model: string
  brand: string
  imeiNo: string
  serialNo: string
  warrantyUntil30Days: boolean
  simCard: boolean
  simTray: boolean
  memoryCard: boolean
  charger: boolean
  battery: boolean
  waterDamaged: boolean
  loanEquipment?: boolean
  equipmentObs: string
  repairObs: string
  selectedServices: string[]
  condition: string
  customCondition: string
  problem: string
  price: string
  budget: string
  imeiError: string | null
  repairNumber?: string // Auto-generated, read-only
}

// Brand and Model data
const BRANDS_AND_MODELS: Record<string, string[]> = {
  "Apple": ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini", "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11", "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X", "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7", "iPhone SE (2022)", "iPhone SE (2020)"],
  "Samsung": ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22", "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy Note 20 Ultra", "Galaxy Note 20", "Galaxy A54", "Galaxy A34", "Galaxy A24", "Galaxy A14", "Galaxy A04", "Galaxy Z Fold 5", "Galaxy Z Flip 5", "Galaxy Z Fold 4", "Galaxy Z Flip 4"],
  "Xiaomi": ["Mi 13 Pro", "Mi 13", "Mi 12 Pro", "Mi 12", "Redmi Note 13 Pro", "Redmi Note 13", "Redmi Note 12 Pro", "Redmi Note 12", "Redmi Note 11", "Redmi 13C", "Redmi 12C", "POCO X6 Pro", "POCO X5 Pro", "POCO F5", "POCO M5"],
  "Huawei": ["P60 Pro", "P60", "P50 Pro", "P50", "Mate 60 Pro", "Mate 60", "Mate 50 Pro", "Mate 50", "Nova 12", "Nova 11", "Nova 10"],
  "Oppo": ["Find X6 Pro", "Find X5 Pro", "Find X5", "Reno 11 Pro", "Reno 11", "Reno 10 Pro", "Reno 10", "A98", "A78", "A58"],
  "Vivo": ["X100 Pro", "X90 Pro", "X90", "V30 Pro", "V30", "V29", "Y36", "Y27", "Y17"],
  "OnePlus": ["12", "11", "10 Pro", "10T", "Nord 3", "Nord 2T", "Nord CE 3"],
  "Realme": ["GT 5 Pro", "GT 5", "GT 3", "11 Pro+", "11 Pro", "11", "10 Pro+", "10 Pro"],
  "Motorola": ["Edge 40 Pro", "Edge 40", "Edge 30 Pro", "Moto G84", "Moto G73", "Moto G54"],
  "Nokia": ["G60 5G", "G42 5G", "G22", "X30 5G", "X20"],
  "Sony": ["Xperia 1 V", "Xperia 5 V", "Xperia 10 V", "Xperia Pro-I"],
  "Google": ["Pixel 8 Pro", "Pixel 8", "Pixel 7 Pro", "Pixel 7", "Pixel 6a", "Pixel 6"],
  "Honor": ["Magic 6 Pro", "Magic 5 Pro", "90 Pro", "90", "70"],
  "Nothing": ["Phone (2)", "Phone (1)"],
  "Other": []
}

const ALL_BRANDS = Object.keys(BRANDS_AND_MODELS)


// Generate Client ID
const generateClientId = (): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `CLI-${timestamp}-${random}`
}

export function NewRepairTicketForm() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [customerName, setCustomerName] = useState("")
  const [clientId, setClientId] = useState(generateClientId())
  const [contact, setContact] = useState("")
  const [receivedBy, setReceivedBy] = useState("")
  const [batchId, setBatchId] = useState<string | null>(null) // Track devices added together
  const [devices, setDevices] = useState<DeviceFormData[]>([
    {
      model: "",
      brand: "",
      imeiNo: "",
      serialNo: "",
      warrantyUntil30Days: false,
      simCard: false,
      simTray: false,
      memoryCard: false,
      charger: false,
      battery: false,
      waterDamaged: false,
      equipmentObs: "",
      repairObs: "",
      selectedServices: [],
      condition: "",
      customCondition: "",
      problem: "",
      price: "",
      budget: "",
      imeiError: null,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdTicketsDetails, setCreatedTicketsDetails] = useState<any[]>([])
  const [showTicketDetails, setShowTicketDetails] = useState(false)
  const [availablePrinters, setAvailablePrinters] = useState<any[]>([])
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null)
  const [isDetectingPrinters, setIsDetectingPrinters] = useState(false)

  // Generate preview Repair Number
  const getRepairNumberPreview = (): string => {
    const year = new Date().getFullYear()
    return `REP-${year}-XXXX` // XXXX will be replaced with actual sequence on server
  }

  // Detect available printers
  const detectPrinters = async () => {
    setIsDetectingPrinters(true)
    try {
      // Load saved printer preference
      const savedPrinter = localStorage.getItem('preferredPrinter')
      if (savedPrinter) {
        setSelectedPrinter(savedPrinter)
      }

      // Note: Browser Print API has limited support
      // We'll use a combination of approaches:
      // 1. Check for saved preference
      // 2. Try to detect via Print API (if available)
      // 3. Show manual selection option
      
      // For now, we'll rely on the browser's print dialog
      // and store the user's selection for next time
      toast.success("Printer detection ready. Select your printer from the print dialog.")
    } catch (error) {
      console.error("Error detecting printers:", error)
    } finally {
      setIsDetectingPrinters(false)
    }
  }

  // Load saved printer preference on mount
  useEffect(() => {
    const savedPrinter = localStorage.getItem('preferredPrinter')
    if (savedPrinter) {
      setSelectedPrinter(savedPrinter)
    }
  }, [])

  // toggleService function removed - services option no longer available

  const addDevice = () => {
    setDevices((prev) => [
      ...prev,
      {
        model: "",
        brand: "",
        imeiNo: "",
        serialNo: "",
        warrantyUntil30Days: false,
        simCard: false,
        simTray: false,
        memoryCard: false,
        charger: false,
        battery: false,
        waterDamaged: false,
        loanEquipment: false,
        equipmentObs: "",
        repairObs: "",
        selectedServices: [],
        condition: "",
        customCondition: "",
        problem: "",
        price: "",
        budget: "",
        imeiError: null,
      },
    ])
  }

  const removeDevice = (index: number) => {
    if (devices.length > 1) {
      setDevices((prev) => prev.filter((_, idx) => idx !== index))
    }
  }

  const updateDevice = (index: number, field: keyof DeviceFormData, value: any) => {
    setDevices((prev) =>
      prev.map((device, idx) => {
        if (idx === index) {
          if (field === "imeiNo") {
            const imeiRegex = /^\d{0,15}$/
            if (!imeiRegex.test(value)) {
              return device
            }
            const imeiError =
              value.length > 0 && value.length !== 15 ? t("error.imei.inline") : null
            return { ...device, imeiNo: value, imeiError }
          }
          return { ...device, [field]: value }
        }
        return device
      })
    )
  }


  // Generate Repair Number (client-side) - Format: YYYY-XXXX
  const generateRepairNumberClient = (existingTickets: any[]): string => {
    const year = new Date().getFullYear()
    const prefix = `${year}-`
    // Support both old format (REP-YYYY-XXXX) and new format (YYYY-XXXX)
    const matchingTickets = existingTickets.filter(t => 
      t.repairNumber?.startsWith(prefix) || t.repairNumber?.startsWith(`REP-${prefix}`)
    )
    const sequence = String(matchingTickets.length + 1).padStart(4, "0")
    return `${prefix}${sequence}`
  }

  // Generate Serial Number (client-side)
  const generateSerialNumberClient = (existingTickets: any[]): string => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, "0")
    const prefix = `SN${year}${month}`
    const matchingTickets = existingTickets.filter(t => t.serialNo?.startsWith(prefix))
    const sequence = String(matchingTickets.length + 1).padStart(4, "0")
    return `${prefix}${sequence}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id) {
      toast.error("User not authenticated")
      return
    }

    // Only customerName and receivedBy are mandatory
    if (!customerName.trim() || !receivedBy.trim()) {
      toast.error("Customer name and Device Received by are required")
      return
    }

    setIsSubmitting(true)

    // Generate batch ID for devices added together (only if not already set)
    const currentBatchId = batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (!batchId) {
      setBatchId(currentBatchId)
    }

    try {
      // Create tickets for all devices via API
      const createdTickets = []
      for (const device of devices) {
        const response = await fetch("/api/repairs/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            clientId: clientId.trim(),
            customerName,
            contact,
            receivedBy: receivedBy.trim(),
            imeiNo: device.imeiNo,
            brand: device.brand || device.model.split(" ")[0] || "N/A",
            model: device.model,
            serialNo: device.serialNo?.trim() || null,
            warranty: device.warrantyUntil30Days ? t("form.warrantyUntil30Days") : t("form.withoutWarranty"),
            simCard: device.simCard,
            simTray: device.simTray,
            memoryCard: device.memoryCard,
            charger: device.charger,
            battery: device.battery,
            waterDamaged: device.waterDamaged,
            loanEquipment: false,
            equipmentObs: device.equipmentObs || null,
            repairObs: device.repairObs || null,
            selectedServices: [],
            condition: null,
            problem: device.problem || null,
            price: parseFloat(device.price),
            budget: device.budget ? parseFloat(device.budget) : null,
            status: "PENDING",
          }),
        })

        let data
        try {
          const responseText = await response.text()
          if (!responseText) {
            throw new Error("Empty response from server")
          }
          try {
            data = JSON.parse(responseText)
          } catch (parseError) {
            console.error("[NewRepairTicketForm] Failed to parse JSON response:", parseError)
            console.error("[NewRepairTicketForm] Response text:", responseText)
            throw new Error(`Server error: ${responseText.substring(0, 200)}`)
          }
        } catch (jsonError: any) {
          console.error("[NewRepairTicketForm] Failed to parse response:", jsonError)
          throw new Error(jsonError.message || "Invalid response from server. Please try again.")
        }

        if (!response.ok) {
          // Extract error message - prioritize specific error messages
          let errorMessage = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`
          
          // If there are details, append them for better debugging
          if (data?.details && typeof data.details === 'object') {
            const detailsStr = Object.entries(data.details)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
            if (detailsStr) {
              console.error("[NewRepairTicketForm] Error details:", detailsStr)
            }
          }
          
          console.error("[NewRepairTicketForm] API Error:", {
            status: response.status,
            statusText: response.statusText,
            data: data,
            error: errorMessage
          })
          
          // Show specific error message to user
          toast.error(errorMessage)
          throw new Error(errorMessage)
        }

        // Normalize ticket data - parse JSON fields if needed
        const ticket = data?.ticket || data
        if (ticket && typeof ticket === 'object') {
          // Parse selectedServices if it's a string
          if (typeof ticket.selectedServices === 'string') {
            try {
              ticket.selectedServices = JSON.parse(ticket.selectedServices)
            } catch (e) {
              console.error("[NewRepairTicketForm] Error parsing selectedServices:", e)
              ticket.selectedServices = []
            }
          }
          
          // Ensure all required fields exist
          const normalizedTicket = {
            ...ticket,
            clientId: ticket.clientId || clientId.trim(),
            customerName: ticket.customerName || customerName,
            contact: ticket.contact || contact,
            receivedBy: ticket.receivedBy || receivedBy.trim(),
            imeiNo: ticket.imeiNo || device.imeiNo,
            brand: ticket.brand || device.brand || "N/A",
            model: ticket.model || device.model,
            serialNo: ticket.serialNo || null,
            warranty: ticket.warranty || t("form.withoutWarranty"),
            simCard: ticket.simCard ?? false,
            simTray: ticket.simTray ?? false,
            memoryCard: ticket.memoryCard ?? false,
            charger: ticket.charger ?? false,
            battery: ticket.battery ?? false,
            waterDamaged: ticket.waterDamaged ?? false,
            loanEquipment: false,
            equipmentObs: ticket.equipmentObs || null,
            repairObs: ticket.repairObs || null,
            selectedServices: Array.isArray(ticket.selectedServices) ? ticket.selectedServices : (device.selectedServices || []),
            condition: ticket.condition || null,
            problem: ticket.problem || device.problem,
            price: ticket.price || parseFloat(device.price),
            budget: ticket.budget || (device.budget ? parseFloat(device.budget) : null),
            repairNumber: ticket.repairNumber || "N/A",
            createdAt: ticket.createdAt || new Date().toISOString(),
          }
          
          createdTickets.push(normalizedTicket)
        } else {
          console.error("[NewRepairTicketForm] No valid ticket data returned from server. Response data:", data)
          throw new Error("No ticket data returned from server")
        }
      }

      console.log(`[NewRepairTicketForm] Successfully created ${createdTickets.length} device ticket(s)`)
      toast.success(`${createdTickets.length} device${createdTickets.length > 1 ? "s" : ""} entry created successfully!`)

      // Store created tickets details with batch ID for tracking
      const currentBatchId = batchId || `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const ticketsWithBatch = createdTickets.map((ticket, index) => ({
        ...ticket,
        batchId: currentBatchId,
        deviceIndex: index + 1 // Add device index for display
      }))
      
      console.log(`[NewRepairTicketForm] Storing ${ticketsWithBatch.length} ticket(s) with batchId: ${currentBatchId}`)
      console.log(`[NewRepairTicketForm] Ticket details:`, ticketsWithBatch.map(t => ({
        device: t.deviceIndex,
        repairNumber: t.repairNumber,
        brand: t.brand,
        model: t.model
      })))
      
      setCreatedTicketsDetails(ticketsWithBatch)
      setShowTicketDetails(true)
      
      // Scroll to Devices Information section after a short delay
      setTimeout(() => {
        try {
          const devicesSection = document.getElementById('devices-information-section')
          if (devicesSection) {
            devicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
            // Also expand the section if it's collapsed
            const showButton = document.querySelector('[data-show-devices-button]') as HTMLButtonElement
            if (showButton) {
              const buttonText = showButton.textContent || ''
              if (!buttonText.toLowerCase().includes('hide')) {
                showButton.click()
              }
            }
          }
        } catch (scrollError) {
          console.error("[NewRepairTicketForm] Error scrolling to devices section:", scrollError)
          // Don't block the flow if scrolling fails
        }
      }, 500)

      // Print receipt for all devices added together
      if (createdTickets.length > 0) {
        try {
          // Always pass all created tickets to print function
          // The print function will handle grouping and display all devices
          console.log(`[NewRepairTicketForm] Printing receipt for ${createdTickets.length} device(s)`)
          printReceipt(createdTickets)
        } catch (printError) {
          console.error("[NewRepairTicketForm] Error printing receipt:", printError)
          toast.error("Device entry created, but failed to print receipt. You can print it later from the device list.")
        }
      } else {
        console.error("[NewRepairTicketForm] No tickets created to print")
        toast.error("Device entry created, but no receipt data available.")
      }
      
      // Reset batch ID for next submission (devices added separately will have different batch IDs)
      setBatchId(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to create repair ticket")
    } finally {
      setIsSubmitting(false)
    }
  }

  const printReceipt = (tickets: any[]) => {
    // Use the wrapper function that shows language selection dialog first
    printReceiptWithLanguageSelection(tickets, selectedPrinter)
  }

  // Handle continue/close after viewing ticket details
  const handleContinue = () => {
    // Reset form
    setCustomerName("")
    setClientId(generateClientId())
    setContact("")
    setReceivedBy("")
    setBatchId(null) // Reset batch ID for new entry
    setDevices([{
      model: "",
      brand: "",
      imeiNo: "",
      serialNo: "",
      warrantyUntil30Days: false,
      simCard: false,
      simTray: false,
      memoryCard: false,
      charger: false,
      battery: false,
      waterDamaged: false,
      loanEquipment: false,
      equipmentObs: "",
      repairObs: "",
      selectedServices: [],
      condition: "",
      customCondition: "",
      problem: "",
      price: "",
      budget: "",
      imeiError: null,
    }])
    setCreatedTicketsDetails([])
    setShowTicketDetails(false)
    
    // Scroll to Devices Information section
    setTimeout(() => {
      const devicesSection = document.getElementById('devices-information-section')
      if (devicesSection) {
        devicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Also expand the section if it's collapsed
        const showButton = document.querySelector('[data-show-devices-button]') as HTMLButtonElement
        if (showButton && !showButton.textContent?.includes('Hide')) {
          showButton.click()
        }
      }
    }, 100)
  }

  // Print ticket details
  const handlePrintDetails = () => {
    if (createdTicketsDetails.length > 0) {
      printReceipt(createdTicketsDetails)
    }
  }

  // Handle printer selection
  const handlePrinterSelect = (printerName: string) => {
    setSelectedPrinter(printerName)
    localStorage.setItem('preferredPrinter', printerName)
    toast.success(`Printer selected: ${printerName}`)
  }

  // Export printReceipt function for use in other components
  // This will be available via the component's ref or we can create a separate export
  return (
    <div className="space-y-6">
      {!showTicketDetails ? (
        <Card className="shadow-2xl border border-blue-200 bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 rounded-t-lg px-6 py-4">
        <CardTitle className="text-2xl flex items-center gap-2 text-black">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t("page.newTicket.customerDeviceInformation")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-black">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Add New Device Button at Top */}
          <div className="flex justify-end pb-4 border-b border-blue-200">
            <Button
              type="button"
              variant="outline"
              onClick={addDevice}
              className="border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("form.addAnotherDevice")}
            </Button>
            </div>

          {/* Customer Information - Only show and allow editing for first device */}
          {devices.length > 0 && (
            <div className="grid gap-6 grid-cols-3 border-b border-blue-200 pb-6">
              <div className="space-y-3">
                <Label htmlFor="customerName" className="text-black text-base font-semibold">{t("form.customerName")} *</Label>
                {devices.length === 1 ? (
                  <Input
                    id="customerName"
                    placeholder={t("placeholder.customerName")}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500 h-12 text-lg"
                  />
                ) : (
                  <div className="bg-white border border-blue-200 rounded-md px-4 py-3 h-12 text-lg text-black flex items-center">
                    {customerName || t("common.notAvailable")}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="contact" className="text-black text-base font-semibold">{t("form.clientPhone")}</Label>
                {devices.length === 1 ? (
                  <Input
                    id="contact"
                    type="tel"
                    placeholder={t("form.clientPhonePlaceholder")}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500 h-12 text-lg"
                  />
                ) : (
                  <div className="bg-white border border-blue-200 rounded-md px-4 py-3 h-12 text-lg text-black flex items-center">
                    {contact || t("common.notAvailable")}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label htmlFor="receivedBy" className="text-black text-base font-semibold">{t("form.receivedBy")} *</Label>
                {devices.length === 1 ? (
                  <Input
                    id="receivedBy"
                    placeholder={t("placeholder.receivedBy") || "Enter your name"}
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    required
                    className="bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500 h-12 text-lg"
                  />
                ) : (
                  <div className="bg-white border border-blue-200 rounded-md px-4 py-3 h-12 text-lg text-black flex items-center">
                    {receivedBy || t("common.notAvailable")}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Devices */}
          <div className="space-y-6">
            {devices.map((device, deviceIndex) => (
              <div
                key={deviceIndex}
                className="border-2 border-blue-200 rounded-xl p-6 bg-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">{t("form.device")} {deviceIndex + 1}</h3>
                  {devices.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDevice(deviceIndex)}
                      className="border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t("form.remove")}
                    </Button>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-black">{t("form.brand")}</Label>
                    <div className="relative">
                      <Input
                        placeholder={t("form.brandPlaceholder")}
                        value={device.brand}
                        onChange={(e) => {
                          updateDevice(deviceIndex, "brand", e.target.value)
                          // Clear model when brand changes
                          if (e.target.value !== device.brand) {
                            updateDevice(deviceIndex, "model", "")
                          }
                        }}
                        className="bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500 pr-10"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="bg-white border-gray-200 w-[200px] p-1 max-h-[300px] overflow-y-auto">
                          <div className="space-y-1">
                            {ALL_BRANDS.map((brand) => (
                              <button
                                key={brand}
                                type="button"
                                onClick={() => {
                                  updateDevice(deviceIndex, "brand", brand)
                                  updateDevice(deviceIndex, "model", "")
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                              >
                                {brand}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-black">{t("form.model")}</Label>
                    <div className="relative">
                      <Input
                        placeholder={device.brand ? t("form.modelPlaceholder") : t("form.selectBrandFirst")}
                        value={device.model}
                        onChange={(e) => updateDevice(deviceIndex, "model", e.target.value)}
                        disabled={!device.brand}
                        className="bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500 pr-10 disabled:opacity-50"
                      />
                      {device.brand && device.brand !== "Other" && BRANDS_AND_MODELS[device.brand] && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="bg-white border-gray-200 w-[250px] p-1 max-h-[300px] overflow-y-auto">
                            <div className="space-y-1">
                              {BRANDS_AND_MODELS[device.brand].map((model) => (
                                <button
                                  key={model}
                                  type="button"
                                  onClick={() => updateDevice(deviceIndex, "model", model)}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                  {model}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-black text-base font-semibold">{t("form.imei")}</Label>
                    <Input
                      placeholder={t("placeholder.imei")}
                      value={device.imeiNo}
                      onChange={(e) => updateDevice(deviceIndex, "imeiNo", e.target.value)}
                      maxLength={15}
                      inputMode="numeric"
                      className={`bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500 h-12 text-lg ${device.imeiError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                    />
                    {device.imeiError && <p className="text-xs text-red-600">{device.imeiError}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-gray-700 text-base font-semibold">{t("form.laptopSerialNumber")}</Label>
                    <Input
                      placeholder={t("form.laptopSerialNumberPlaceholder")}
                      value={device.serialNo || ""}
                      onChange={(e) => updateDevice(deviceIndex, "serialNo", e.target.value)}
                      className="bg-white border-gray-300 text-gray-900 placeholder:text-black focus:border-blue-500 h-12 text-lg"
                    />
                    <p className="text-xs text-black">{t("form.laptopSerialNumberHint")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-black">{t("form.warranty")}</Label>
                    <label className="flex items-center gap-2 text-sm text-black hover:text-black cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer bg-white border-blue-200 text-blue-600 focus:ring-blue-500 rounded"
                        checked={device.warrantyUntil30Days}
                        onChange={(e) => updateDevice(deviceIndex, "warrantyUntil30Days", e.target.checked)}
                      />
                      <span>{t("form.warrantyUntil30Days")}</span>
                    </label>
                  </div>

                  {/* Equipment Observations */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-black">{t("form.equipmentObservations")}</Label>
                    <Textarea
                      placeholder={t("form.equipmentObservationsPlaceholder")}
                      value={device.equipmentObs}
                      onChange={(e) => updateDevice(deviceIndex, "equipmentObs", e.target.value)}
                      rows={2}
                      className="bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500"
                    />
                  </div>

                  {/* Equipment Check - All 6 blocks in one line */}
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-black text-sm font-semibold mb-2 block">{t("form.equipmentCheck")}</Label>
                    <div className="grid grid-cols-6 gap-2">
                      {/* 1. SIM Card */}
                      <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-blue-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer bg-white border-blue-200 text-blue-600 focus:ring-blue-500 rounded"
                          checked={device.simCard}
                          onChange={(e) => updateDevice(deviceIndex, "simCard", e.target.checked)}
                        />
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor"/>
                            <path d="M4 4l3-3v3H4z" fill="currentColor" opacity="0.6"/>
                            <rect x="8" y="9" width="2" height="1.5" fill="white" opacity="0.9"/>
                            <rect x="11" y="9" width="2" height="1.5" fill="white" opacity="0.9"/>
                            <rect x="14" y="9" width="2" height="1.5" fill="white" opacity="0.9"/>
                          </svg>
                          <span className="text-xs font-medium text-black">{t("form.simCard")}</span>
                        </div>
                      </label>
                      
                      {/* 2. SIM Tray */}
                      <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-blue-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer bg-white border-blue-200 text-blue-600 focus:ring-blue-500 rounded"
                          checked={device.simTray}
                          onChange={(e) => updateDevice(deviceIndex, "simTray", e.target.checked)}
                        />
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="8" width="12" height="8" rx="1" fill="currentColor"/>
                            <rect x="7" y="10" width="10" height="4" fill="white" opacity="0.3"/>
                            <rect x="9" y="11" width="6" height="2" fill="white" opacity="0.5"/>
                          </svg>
                          <span className="text-xs font-medium text-black">{t("form.simTray")}</span>
                        </div>
                      </label>
                      
                      {/* 3. Memory Card */}
                      <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-blue-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer bg-white border-blue-200 text-blue-600 focus:ring-blue-500 rounded"
                          checked={device.memoryCard}
                          onChange={(e) => updateDevice(deviceIndex, "memoryCard", e.target.checked)}
                        />
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 4h16v16H4V4zm2 2v12h12V6H6z" fill="currentColor"/>
                            <path d="M4 4h3v3H4V4z" fill="currentColor" opacity="0.7"/>
                            <rect x="8" y="7" width="8" height="10" fill="white" opacity="0.2"/>
                          </svg>
                          <span className="text-xs font-medium text-black">{t("form.memoryCard")}</span>
                        </div>
                      </label>
                      
                      {/* 4. Charger */}
                      <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-blue-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer bg-white border-blue-200 text-blue-600 focus:ring-blue-500 rounded"
                          checked={device.charger}
                          onChange={(e) => updateDevice(deviceIndex, "charger", e.target.checked)}
                        />
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="9" y="2" width="6" height="8" rx="1" fill="currentColor"/>
                            <rect x="8" y="6" width="1.5" height="4" rx="0.3" fill="currentColor"/>
                            <rect x="14.5" y="6" width="1.5" height="4" rx="0.3" fill="currentColor"/>
                            <path d="M12 10v10M10 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span className="text-xs font-medium text-black">{t("form.charger")}</span>
                        </div>
                      </label>
                      
                      {/* 5. Battery */}
                      <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-blue-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer bg-white border-blue-200 text-blue-600 focus:ring-blue-500 rounded"
                          checked={device.battery}
                          onChange={(e) => updateDevice(deviceIndex, "battery", e.target.checked)}
                        />
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="4" y="7" width="14" height="10" rx="1" fill="currentColor"/>
                            <rect x="18" y="10" width="2" height="4" rx="0.5" fill="currentColor"/>
                            <rect x="6" y="9" width="10" height="6" rx="0.5" fill="white" opacity="0.9"/>
                          </svg>
                          <span className="text-xs font-medium text-black">{t("form.battery")}</span>
                        </div>
                      </label>
                      
                      {/* 6. Water Damaged */}
                      <label className="flex items-center gap-1.5 p-2 bg-white rounded border border-blue-200 hover:border-red-500 hover:bg-red-50 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer bg-white border-blue-200 text-red-600 focus:ring-red-500 rounded"
                          checked={device.waterDamaged}
                          onChange={(e) => updateDevice(deviceIndex, "waterDamaged", e.target.checked)}
                        />
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19.36 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.64-4.96z"/>
                            <path d="M7 16l1 2h2l-1-2M11 16l1 2h2l-1-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                          </svg>
                          <span className="text-xs font-medium text-black">{t("form.waterDamaged")}</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-black">{t("form.repairObservations")}</Label>
                    <Textarea
                      placeholder={t("form.repairObservationsPlaceholder")}
                      value={device.repairObs}
                      onChange={(e) => updateDevice(deviceIndex, "repairObs", e.target.value)}
                      rows={2}
                      className="bg-white border-blue-200 text-black placeholder:text-black focus:border-blue-500"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                      <Label className="text-gray-700">{t("form.price")}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-lg font-semibold">€</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          placeholder={t("placeholder.price")}
                          value={device.price}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            updateDevice(deviceIndex, "price", value)
                          }}
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-black focus:border-blue-500 pl-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-700">{t("form.budget")}</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-lg font-semibold">€</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          placeholder={t("placeholder.budget") || "Budget"}
                          value={device.budget}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9.]/g, '')
                            updateDevice(deviceIndex, "budget", value)
                          }}
                          className="bg-white border-gray-300 text-gray-900 placeholder:text-black focus:border-blue-500 pl-8 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-gray-700">{t("form.repairNumber")}</Label>
                    <Input
                      value={getRepairNumberPreview()}
                      disabled
                      className="bg-purple-50 border-purple-200 text-purple-700 font-mono font-semibold cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">{t("form.repairNumberHint")}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} className="px-8 border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                {t("form.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg px-8 text-white hover:shadow-xl hover:shadow-blue-500/20 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {devices.length > 1 
                      ? t("form.createDeviceEntries").replace("{count}", devices.length.toString())
                      : t("form.createDeviceEntry").replace("{count}", devices.length.toString())
                    }
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
      ) : (
        <Card className="shadow-2xl border border-gray-200 bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 rounded-t-lg px-6 py-4">
            <CardTitle className="text-2xl flex items-center gap-2 text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Ticket Details - {createdTicketsDetails.length} Device{createdTicketsDetails.length > 1 ? "s" : ""} Created
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-black space-y-6">
            {createdTicketsDetails && createdTicketsDetails.length > 0 ? (
              createdTicketsDetails.map((ticket: any, index: number) => {
              const servicesArray = Array.isArray(ticket?.selectedServices) 
                ? ticket?.selectedServices 
                : (typeof ticket?.selectedServices === 'string' 
                  ? (() => {
                      try {
                        return JSON.parse(ticket?.selectedServices || '[]')
                      } catch {
                        return []
                      }
                    })()
                  : [])
              const services = servicesArray.length > 0 ? servicesArray.join(", ") : "N/A"
              
              return (
                <div key={ticket?.id || index} className="border-2 border-blue-200 rounded-xl p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-black">Device {index + 1}</h3>
                    <Badge className="bg-green-100 text-green-700 border-green-300">
                      {ticket?.status || "PENDING"}
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Repair Information */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-600 border-b border-blue-200 pb-2">Repair Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-black">Repair Number:</span> <span className="text-black font-mono">{ticket?.repairNumber || "N/A"}</span></div>
                        {ticket?.spu && <div><span className="text-black">SPU:</span> <span className="text-black">{ticket.spu}</span></div>}
                        <div><span className="text-black">Entry Date:</span> <span className="text-black">{ticket?.createdAt ? new Date(ticket.createdAt).toLocaleString() : "N/A"}</span></div>
                      </div>
                    </div>

                    {/* Client Information */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-600 border-b border-blue-200 pb-2">Client Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-black">Customer Name:</span> <span className="text-black">{ticket?.customerName || "N/A"}</span></div>
                        <div><span className="text-black">Contact:</span> <span className="text-black">{ticket?.contact || "N/A"}</span></div>
                      </div>
                    </div>

                    {/* Device Information */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-600 border-b border-blue-200 pb-2">Device Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-black">IMEI:</span> <span className="text-black font-mono">{ticket?.imeiNo || "N/A"}</span></div>
                        <div><span className="text-black">Brand:</span> <span className="text-black">{ticket?.brand || "N/A"}</span></div>
                        <div><span className="text-black">Model:</span> <span className="text-black">{ticket?.model || "N/A"}</span></div>
                        {ticket?.serialNo && <div><span className="text-black">Serial Number:</span> <span className="text-black">{ticket.serialNo}</span></div>}
                        {ticket?.softwareVersion && <div><span className="text-black">Software Version:</span> <span className="text-black">{ticket.softwareVersion}</span></div>}
                      </div>
                    </div>

                    {/* Warranty & Equipment Check */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-blue-600 border-b border-blue-200 pb-2">Warranty & Equipment</h4>
                      <div className="space-y-2 text-sm">
                        <div><span className="text-black">Warranty:</span> <span className="text-black">{ticket?.warranty || "Without Warranty"}</span></div>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          <div><span className="text-black">SIM Card:</span> <span className="text-black">{ticket?.simCard ? "Yes" : "No"}</span></div>
                          <div><span className="text-black">SIM Tray:</span> <span className="text-black">{ticket?.simTray ? "Yes" : "No"}</span></div>
                          <div><span className="text-black">Memory Card:</span> <span className="text-black">{ticket?.memoryCard ? "Yes" : "No"}</span></div>
                          <div><span className="text-black">Charger:</span> <span className="text-black">{ticket?.charger ? "Yes" : "No"}</span></div>
                          <div><span className="text-black">Battery:</span> <span className="text-black">{ticket?.battery ? "Yes" : "No"}</span></div>
                          <div><span className="text-black">Water Damaged:</span> <span className="text-black">{ticket?.waterDamaged ? "Yes" : "No"}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Observations */}
                    {(ticket?.equipmentObs || ticket?.repairObs) && (
                      <div className="space-y-3 md:col-span-2">
                        <h4 className="text-sm font-semibold text-blue-600 border-b border-blue-200 pb-2">Observations</h4>
                        <div className="space-y-2 text-sm">
                          {ticket?.equipmentObs && (
                            <div>
                              <span className="text-black block mb-1">Equipment Observations:</span>
                              <div className="text-black bg-white p-3 rounded border border-blue-200">{ticket.equipmentObs}</div>
                            </div>
                          )}
                          {ticket?.repairObs && (
                            <div>
                              <span className="text-black block mb-1">Repair Observations:</span>
                              <div className="text-black bg-white p-3 rounded border border-blue-200">{ticket.repairObs}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    <div className="space-y-3 md:col-span-2">
                      <h4 className="text-sm font-semibold text-blue-600 border-b border-blue-200 pb-2">Pricing</h4>
                      <div className="text-lg font-bold text-green-600">
                        Price: €{ticket?.price ? Number.parseFloat(ticket.price).toFixed(2) : "0.00"}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
            ) : (
              <div className="text-center py-8 text-black">
                <p>No device information available.</p>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-4 border-t border-blue-200">
              {/* Printer Selection */}
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-blue-200">
                <div className="flex-1">
                  <Label className="text-black text-sm mb-2 block">Selected Printer</Label>
                  {selectedPrinter ? (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-black font-medium">{selectedPrinter}</span>
                    </div>
                  ) : (
                    <p className="text-black text-sm">No printer selected. Will use default printer from print dialog.</p>
                  )}
                </div>
                <Button
                  onClick={detectPrinters}
                  variant="outline"
                  size="sm"
                  disabled={isDetectingPrinters}
                  className="border-blue-200 bg-white text-black hover:bg-blue-50"
                >
                  {isDetectingPrinters ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Detecting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Detect Printers
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handlePrintDetails}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Receipt
                </Button>
                <Button
                  onClick={handleContinue}
                  variant="outline"
                  className="border-blue-200 bg-white text-black hover:bg-blue-50"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper function to translate warranty value to selected language
function translateWarrantyValue(storedValue: string | null | undefined, targetLang: "en" | "pt" | "de" | "fr" | "ur" | "pa" | "hi"): string {
  if (!storedValue) return "Without Warranty"
  
  // All possible warranty translations across all languages
  const warrantyTranslations: Record<string, Record<string, string>> = {
    "Warranty Until 30 days": {
      en: "Warranty Until 30 days",
      pt: "Garantia até 30 dias",
      de: "Garantie bis 30 Tage",
      fr: "Garantie jusqu'à 30 jours",
      ur: "30 دن تک گارنٹی",
      pa: "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      hi: "30 दिनों तक वारंटी"
    },
    "Without Warranty": {
      en: "Without Warranty",
      pt: "Sem Garantia",
      de: "Ohne Garantie",
      fr: "Sans garantie",
      ur: "بغیر گارنٹی",
      pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      hi: "वारंटी के बिना"
    },
    // Portuguese
    "Garantia até 30 dias": {
      en: "Warranty Until 30 days",
      pt: "Garantia até 30 dias",
      de: "Garantie bis 30 Tage",
      fr: "Garantie jusqu'à 30 jours",
      ur: "30 دن تک گارنٹی",
      pa: "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      hi: "30 दिनों तक वारंटी"
    },
    "Sem Garantia": {
      en: "Without Warranty",
      pt: "Sem Garantia",
      de: "Ohne Garantie",
      fr: "Sans garantie",
      ur: "بغیر گارنٹی",
      pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      hi: "वारंटी के बिना"
    },
    // German
    "Garantie bis 30 Tage": {
      en: "Warranty Until 30 days",
      pt: "Garantia até 30 dias",
      de: "Garantie bis 30 Tage",
      fr: "Garantie jusqu'à 30 jours",
      ur: "30 دن تک گارنٹی",
      pa: "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      hi: "30 दिनों तक वारंटी"
    },
    "Ohne Garantie": {
      en: "Without Warranty",
      pt: "Sem Garantia",
      de: "Ohne Garantie",
      fr: "Sans garantie",
      ur: "بغیر گارنٹی",
      pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      hi: "वारंटी के बिना"
    },
    // French
    "Garantie jusqu'à 30 jours": {
      en: "Warranty Until 30 days",
      pt: "Garantia até 30 dias",
      de: "Garantie bis 30 Tage",
      fr: "Garantie jusqu'à 30 jours",
      ur: "30 دن تک گارنٹی",
      pa: "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      hi: "30 दिनों तक वारंटी"
    },
    "Sans garantie": {
      en: "Without Warranty",
      pt: "Sem Garantia",
      de: "Ohne Garantie",
      fr: "Sans garantie",
      ur: "بغیر گارنٹی",
      pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      hi: "वारंटी के बिना"
    },
    // Urdu
    "30 دن تک گارنٹی": {
      en: "Warranty Until 30 days",
      pt: "Garantia até 30 dias",
      de: "Garantie bis 30 Tage",
      fr: "Garantie jusqu'à 30 jours",
      ur: "30 دن تک گارنٹی",
      pa: "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      hi: "30 दिनों तक वारंटी"
    },
    "بغیر گارنٹی": {
      en: "Without Warranty",
      pt: "Sem Garantia",
      de: "Ohne Garantie",
      fr: "Sans garantie",
      ur: "بغیر گارنٹی",
      pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      hi: "वारंटी के बिना"
    },
    // Punjabi
    "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ": {
      en: "Warranty Until 30 days",
      pt: "Garantia até 30 dias",
      de: "Garantie bis 30 Tage",
      fr: "Garantie jusqu'à 30 jours",
      ur: "30 دن تک گارنٹی",
      pa: "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      hi: "30 दिनों तक वारंटी"
    },
    "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ": {
      en: "Without Warranty",
      pt: "Sem Garantia",
      de: "Ohne Garantie",
      fr: "Sans garantie",
      ur: "بغیر گارنٹی",
      pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      hi: "वारंटी के बिना"
    },
    // Hindi
    "30 दिनों तक वारंटी": {
      en: "Warranty Until 30 days",
      pt: "Garantia até 30 dias",
      de: "Garantie bis 30 Tage",
      fr: "Garantie jusqu'à 30 jours",
      ur: "30 دن تک گارنٹی",
      pa: "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      hi: "30 दिनों तक वारंटी"
    },
    "वारंटी के बिना": {
      en: "Without Warranty",
      pt: "Sem Garantia",
      de: "Ohne Garantie",
      fr: "Sans garantie",
      ur: "بغیر گارنٹی",
      pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      hi: "वारंटी के बिना"
    }
  }
  
  // Check if stored value matches any known warranty translation
  const normalizedValue = storedValue.trim()
  if (warrantyTranslations[normalizedValue]) {
    return warrantyTranslations[normalizedValue][targetLang] || warrantyTranslations[normalizedValue].en
  }
  
  // If no match found, return default based on target language
  const defaults: Record<string, string> = {
    en: "Without Warranty",
    pt: "Sem Garantia",
    de: "Ohne Garantie",
    fr: "Sans garantie",
    ur: "بغیر گارنٹی",
    pa: "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
    hi: "वारंटी के बिना"
  }
  
  return defaults[targetLang] || defaults.en
}

// Helper function to get translations for receipt printing
function getReceiptTranslations(lang: "en" | "pt" | "de" | "fr" | "ur" | "pa" | "hi" = "en") {
  const translations: Record<string, Record<string, string>> = {
    en: {
      "receipt.clientCopy": "CLIENT COPY",
      "receipt.adminCopy": "ADMIN COPY",
      "receipt.clientId": "Client ID",
      "receipt.name": "Name",
      "receipt.clientPhone": "Client Phone",
      "receipt.receivedBy": "Device Received By",
      "receipt.entryDate": "Entry Date",
      "receipt.repairN": "Repair n",
      "receipt.imei": "IMEI",
      "receipt.brandModel": "Brand-Model",
      "receipt.laptopSerialN": "Laptop Serial N",
      "receipt.warranty": "Warranty",
      "receipt.equipmentCheck": "Equipment Check",
      "receipt.equipmentObs": "Equipment Obs.",
      "receipt.repairObs": "Repair Obs.",
      "receipt.services": "Services",
      "receipt.problem": "Problem",
      "receipt.price": "Price",
      "receipt.responsibleText": "WE ARE RESPONSIBLE FOR THE ASSISTANCE / REPAIRING OF THE DESCRIBED ANOMALIES.",
      "receipt.storageTitle": "Condies de Armazenamento e Levantamento",
      "receipt.storageText1": "O equipamento dever ser levantado no prazo mximo de sessenta (60) dias aps a concluso da reparao e respetiva notificao por",
      "receipt.storageText2": "Decorrido este prazo, ser aplicada uma taxa de armazenamento de 0,95  por dia, a partir do 61. dia, at ao limite mximo de cento e vinte (120) dias, aplicvel independentemente de a reparao ter sido realizada ou de o oramento ter sido recusado.",
      "receipt.storageText3": "Ao aceitar o presente documento, o cliente declara que leu, compreendeu e aceita os termos e condies de reparao.",
      "receipt.repairReference": "Referncia da Reparao",
      "receipt.cutHere": "CUT HERE",
      "common.yes": "Yes",
      "common.no": "No",
      "form.warrantyUntil30Days": "Warranty Until 30 days",
      "form.withoutWarranty": "Without Warranty",
      "form.simCard": "SIM Card",
      "form.simTray": "SIM Tray",
      "form.memoryCard": "Memory Card",
      "form.charger": "Charger",
      "form.battery": "Battery",
      "form.waterDamaged": "Water Damaged",
    },
    pt: {
      "receipt.clientCopy": "CÓPIA DO CLIENTE",
      "receipt.adminCopy": "CÓPIA DO ADMINISTRADOR",
      "receipt.clientId": "ID do Cliente",
      "receipt.name": "Nome",
      "receipt.clientPhone": "Telefone do Cliente",
      "receipt.receivedBy": "Dispositivo Recebido Por",
      "receipt.entryDate": "Data de Entrada",
      "receipt.repairN": "Reparação n",
      "receipt.imei": "IMEI",
      "receipt.brandModel": "Marca-Modelo",
      "receipt.laptopSerialN": "Número de Série do Portátil",
      "receipt.warranty": "Garantia",
      "receipt.equipmentCheck": "Verificação de Equipamento",
      "receipt.equipmentObs": "Obs. de Equipamento",
      "receipt.repairObs": "Obs. de Reparação",
      "receipt.services": "Serviços",
      "receipt.problem": "Problema",
      "receipt.price": "Preço",
      "receipt.responsibleText": "SOMOS RESPONSÁVEIS PELA ASSISTÊNCIA / REPARAÇÃO DAS ANOMALIAS DESCRITAS.",
      "receipt.storageTitle": "Condições de Armazenamento e Levantamento",
      "receipt.storageText1": "O equipamento deverá ser levantado no prazo máximo de sessenta (60) dias após a conclusão da reparação e respetiva notificação por",
      "receipt.storageText2": "Decorrido este prazo, será aplicada uma taxa de armazenamento de 0,95 € por dia, a partir do 61.º dia, até ao limite máximo de cento e vinte (120) dias, aplicável independentemente de a reparação ter sido realizada ou de o orçamento ter sido recusado.",
      "receipt.storageText3": "Ao aceitar o presente documento, o cliente declara que leu, compreendeu e aceita os termos e condições de reparação.",
      "receipt.repairReference": "Referência da Reparação",
      "receipt.cutHere": "CORTAR AQUI",
      "common.yes": "Sim",
      "common.no": "Não",
      "form.warrantyUntil30Days": "Garantia até 30 dias",
      "form.withoutWarranty": "Sem Garantia",
      "form.simCard": "Cartão SIM",
      "form.simTray": "Tabuleiro SIM",
      "form.memoryCard": "Cartão de Memória",
      "form.charger": "Carregador",
      "form.battery": "Bateria",
      "form.waterDamaged": "Danificado por Água",
    },
    de: {
      "receipt.clientCopy": "KUNDENKOPIE",
      "receipt.adminCopy": "ADMIN-KOPIE",
      "receipt.clientId": "Kunden-ID",
      "receipt.name": "Name",
      "receipt.clientPhone": "Kundentelefon",
      "receipt.receivedBy": "Gerät erhalten von",
      "receipt.entryDate": "Eingangsdatum",
      "receipt.repairN": "Reparatur Nr.",
      "receipt.imei": "IMEI",
      "receipt.brandModel": "Marke-Modell",
      "receipt.laptopSerialN": "Laptop-Seriennummer",
      "receipt.warranty": "Garantie",
      "receipt.equipmentCheck": "Geräteprüfung",
      "receipt.equipmentObs": "Gerätebeobachtung",
      "receipt.repairObs": "Reparaturbeobachtung",
      "receipt.services": "Dienstleistungen",
      "receipt.problem": "Problem",
      "receipt.price": "Preis",
      "receipt.responsibleText": "WIR SIND VERANTWORTLICH FÜR DIE ASSISTENZ / REPARATUR DER BESCHRIEBENEN ANOMALIEN.",
      "receipt.storageTitle": "Lagerungs- und Abholbedingungen",
      "receipt.storageText1": "Das Gerät muss innerhalb von sechzig (60) Tagen nach Abschluss der Reparatur und entsprechender Benachrichtigung durch",
      "receipt.storageText2": "abgeholt werden. Nach Ablauf dieser Frist wird ab dem 61. Tag eine Lagergebühr von 0,95 € pro Tag bis zum Höchstlimit von einhundertzwanzig (120) Tagen erhoben, unabhängig davon, ob die Reparatur durchgeführt wurde oder das Angebot abgelehnt wurde.",
      "receipt.storageText3": "Durch die Annahme dieses Dokuments erklärt der Kunde, dass er die Reparaturbedingungen gelesen, verstanden und akzeptiert hat.",
      "receipt.repairReference": "Reparaturreferenz",
      "receipt.cutHere": "HIER SCHNEIDEN",
      "common.yes": "Ja",
      "common.no": "Nein",
      "form.warrantyUntil30Days": "Garantie bis 30 Tage",
      "form.withoutWarranty": "Ohne Garantie",
      "form.simCard": "SIM-Karte",
      "form.simTray": "SIM-Schublade",
      "form.memoryCard": "Speicherkarte",
      "form.charger": "Ladegerät",
      "form.battery": "Batterie",
      "form.waterDamaged": "Wasserschaden",
    },
    fr: {
      "receipt.clientCopy": "COPIE CLIENT",
      "receipt.adminCopy": "COPIE ADMIN",
      "receipt.clientId": "ID Client",
      "receipt.name": "Nom",
      "receipt.clientPhone": "Téléphone client",
      "receipt.receivedBy": "Appareil reçu par",
      "receipt.entryDate": "Date d'entrée",
      "receipt.repairN": "Réparation n",
      "receipt.imei": "IMEI",
      "receipt.brandModel": "Marque-Modèle",
      "receipt.laptopSerialN": "Numéro de série ordinateur",
      "receipt.warranty": "Garantie",
      "receipt.equipmentCheck": "Vérification de l'équipement",
      "receipt.equipmentObs": "Obs. équipement",
      "receipt.repairObs": "Obs. réparation",
      "receipt.services": "Services",
      "receipt.problem": "Problème",
      "receipt.price": "Prix",
      "receipt.responsibleText": "NOUS SOMMES RESPONSABLES DE L'ASSISTANCE / RÉPARATION DES ANOMALIES DÉCRITES.",
      "receipt.storageTitle": "Conditions de stockage et de retrait",
      "receipt.storageText1": "L'équipement doit être retiré dans un délai maximum de soixante (60) jours après l'achèvement de la réparation et la notification correspondante par",
      "receipt.storageText2": "Après ce délai, des frais de stockage de 0,95 € par jour seront appliqués à partir du 61e jour, jusqu'à la limite maximale de cent vingt (120) jours, applicables indépendamment du fait que la réparation ait été effectuée ou que le devis ait été refusé.",
      "receipt.storageText3": "En acceptant ce document, le client déclare avoir lu, compris et accepté les termes et conditions de réparation.",
      "receipt.repairReference": "Référence de la réparation",
      "receipt.cutHere": "COUPER ICI",
      "common.yes": "Oui",
      "common.no": "Non",
      "form.warrantyUntil30Days": "Garantie jusqu'à 30 jours",
      "form.withoutWarranty": "Sans garantie",
      "form.simCard": "Carte SIM",
      "form.simTray": "Tiroir SIM",
      "form.memoryCard": "Carte mémoire",
      "form.charger": "Chargeur",
      "form.battery": "Batterie",
      "form.waterDamaged": "Endommagé par l'eau",
    },
    ur: {
      "receipt.clientCopy": "کلائنٹ کاپی",
      "receipt.adminCopy": "ایڈمن کاپی",
      "receipt.clientId": "کلائنٹ آئی ڈی",
      "receipt.name": "نام",
      "receipt.clientPhone": "کلائنٹ فون",
      "receipt.receivedBy": "ڈیوائس کس نے وصول کی",
      "receipt.entryDate": "داخلے کی تاریخ",
      "receipt.repairN": "مرمت نمبر",
      "receipt.imei": "IMEI",
      "receipt.brandModel": "برانڈ-ماڈل",
      "receipt.laptopSerialN": "لیپ ٹاپ سیریل نمبر",
      "receipt.warranty": "گارنٹی",
      "receipt.equipmentCheck": "سامان کی جانچ",
      "receipt.equipmentObs": "سامان کی رپورٹ",
      "receipt.repairObs": "مرمت کی رپورٹ",
      "receipt.services": "خدمات",
      "receipt.problem": "مسئلہ",
      "receipt.price": "قیمت",
      "receipt.responsibleText": "ہم بیان کردہ خرابیوں کی مدد / مرمت کے ذمہ دار ہیں۔",
      "receipt.storageTitle": "ذخیرہ کرنے اور اٹھانے کی شرائط",
      "receipt.storageText1": "مرمت مکمل ہونے اور",
      "receipt.storageText2": "کی طرف سے متعلقہ اطلاع کے بعد ساٹھ (60) دنوں کی زیادہ سے زیادہ مدت کے اندر سامان اٹھایا جانا چاہیے۔ اس مدت کے گزرنے کے بعد، 61ویں دن سے شروع ہو کر، ایک سو بیس (120) دنوں کی زیادہ سے زیادہ حد تک، 0.95 یورو فی دن کی ذخیرہ کرنے کی فیس لاگو کی جائے گی، چاہے مرمت کی گئی ہو یا تخمینہ مسترد کر دیا گیا ہو۔",
      "receipt.storageText3": "اس دستاویز کو قبول کرنے سے، کلائنٹ اعلان کرتا ہے کہ اس نے مرمت کی شرائط و ضوابط پڑھے، سمجھے اور قبول کیے ہیں۔",
      "receipt.repairReference": "مرمت کا حوالہ",
      "receipt.cutHere": "یہاں کاٹیں",
      "common.yes": "ہاں",
      "common.no": "نہیں",
      "form.warrantyUntil30Days": "30 دن تک گارنٹی",
      "form.withoutWarranty": "بغیر گارنٹی",
      "form.simCard": "سیم کارڈ",
      "form.simTray": "سیم ٹرے",
      "form.memoryCard": "میموری کارڈ",
      "form.charger": "چارجر",
      "form.battery": "بیٹری",
      "form.waterDamaged": "پانی سے خراب",
    },
    pa: {
      "receipt.clientCopy": "ਕਲਾਇੰਟ ਕਾਪੀ",
      "receipt.adminCopy": "ਐਡਮਿਨ ਕਾਪੀ",
      "receipt.clientId": "ਕਲਾਇੰਟ ਆਈਡੀ",
      "receipt.name": "ਨਾਮ",
      "receipt.clientPhone": "ਕਲਾਇੰਟ ਫੋਨ",
      "receipt.receivedBy": "ਡਿਵਾਈਸ ਕਿਸਨੇ ਪ੍ਰਾਪਤ ਕੀਤੀ",
      "receipt.entryDate": "ਐਂਟਰੀ ਦੀ ਤਾਰੀਖ",
      "receipt.repairN": "ਮੁਰੰਮਤ ਨੰਬਰ",
      "receipt.imei": "IMEI",
      "receipt.brandModel": "ਬ੍ਰਾਂਡ-ਮਾਡਲ",
      "receipt.laptopSerialN": "ਲੈਪਟਾਪ ਸੀਰੀਅਲ ਨੰਬਰ",
      "receipt.warranty": "ਵਾਰੰਟੀ",
      "receipt.equipmentCheck": "ਸਾਮਾਨ ਦੀ ਜਾਂਚ",
      "receipt.equipmentObs": "ਸਾਮਾਨ ਰਿਪੋਰਟ",
      "receipt.repairObs": "ਮੁਰੰਮਤ ਰਿਪੋਰਟ",
      "receipt.services": "ਸੇਵਾਵਾਂ",
      "receipt.problem": "ਸਮੱਸਿਆ",
      "receipt.price": "ਕੀਮਤ",
      "receipt.responsibleText": "ਅਸੀਂ ਦੱਸੀਆਂ ਗਈਆਂ ਖਰਾਬੀਆਂ ਦੀ ਸਹਾਇਤਾ / ਮੁਰੰਮਤ ਦੇ ਜ਼ਿੰਮੇਵਾਰ ਹਾਂ।",
      "receipt.storageTitle": "ਸਟੋਰੇਜ ਅਤੇ ਲਿਆਉਣ ਦੀਆਂ ਸ਼ਰਤਾਂ",
      "receipt.storageText1": "ਮੁਰੰਮਤ ਪੂਰੀ ਹੋਣ ਅਤੇ",
      "receipt.storageText2": "ਦੁਆਰਾ ਸੰਬੰਧਿਤ ਸੂਚਨਾ ਤੋਂ ਬਾਅਦ ਸੱਠ (60) ਦਿਨਾਂ ਦੀ ਵੱਧ ਤੋਂ ਵੱਧ ਮਿਆਦ ਦੇ ਅੰਦਰ ਸਾਮਾਨ ਲਿਆਉਣਾ ਚਾਹੀਦਾ ਹੈ। ਇਸ ਮਿਆਦ ਦੇ ਬੀਤਣ ਤੋਂ ਬਾਅਦ, 61ਵੇਂ ਦਿਨ ਤੋਂ ਸ਼ੁਰੂ ਹੋ ਕੇ, ਇੱਕ ਸੌ ਵੀਹ (120) ਦਿਨਾਂ ਦੀ ਵੱਧ ਤੋਂ ਵੱਧ ਸੀਮਾ ਤੱਕ, 0.95 ਯੂਰੋ ਪ੍ਰਤੀ ਦਿਨ ਦੀ ਸਟੋਰੇਜ ਫੀਸ ਲਾਗੂ ਕੀਤੀ ਜਾਵੇਗੀ, ਭਾਵੇਂ ਮੁਰੰਮਤ ਕੀਤੀ ਗਈ ਹੋਵੇ ਜਾਂ ਅਨੁਮਾਨ ਰੱਦ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੋਵੇ।",
      "receipt.storageText3": "ਇਸ ਦਸਤਾਵੇਜ਼ ਨੂੰ ਸਵੀਕਾਰ ਕਰਨ ਨਾਲ, ਕਲਾਇੰਟ ਐਲਾਨ ਕਰਦਾ ਹੈ ਕਿ ਉਸਨੇ ਮੁਰੰਮਤ ਦੀਆਂ ਸ਼ਰਤਾਂ ਅਤੇ ਸ਼ਰਤਾਂ ਪੜ੍ਹੀਆਂ, ਸਮਝੀਆਂ ਅਤੇ ਸਵੀਕਾਰ ਕੀਤੀਆਂ ਹਨ।",
      "receipt.repairReference": "ਮੁਰੰਮਤ ਦਾ ਹਵਾਲਾ",
      "receipt.cutHere": "ਇੱਥੇ ਕੱਟੋ",
      "receipt.selectLanguage": "ਰਸੀਦ ਦੀ ਭਾਸ਼ਾ ਚੁਣੋ",
      "receipt.selectLanguageDescription": "ਪ੍ਰਿੰਟ ਕੀਤੀ ਰਸੀਦ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ",
      "common.yes": "ਹਾਂ",
      "common.no": "ਨਹੀਂ",
      "form.warrantyUntil30Days": "30 ਦਿਨਾਂ ਤੱਕ ਵਾਰੰਟੀ",
      "form.withoutWarranty": "ਵਾਰੰਟੀ ਤੋਂ ਬਿਨਾਂ",
      "form.simCard": "SIM ਕਾਰਡ",
      "form.simTray": "SIM ਟਰੇ",
      "form.memoryCard": "ਮੈਮੋਰੀ ਕਾਰਡ",
      "form.charger": "ਚਾਰਜਰ",
      "form.battery": "ਬੈਟਰੀ",
      "form.waterDamaged": "ਪਾਣੀ ਨਾਲ ਖਰਾਬ",
    },
    hi: {
      "receipt.clientCopy": "क्लाइंट कॉपी",
      "receipt.adminCopy": "एडमिन कॉपी",
      "receipt.clientId": "क्लाइंट आईडी",
      "receipt.name": "नाम",
      "receipt.clientPhone": "क्लाइंट फोन",
      "receipt.receivedBy": "डिवाइस किसने प्राप्त किया",
      "receipt.entryDate": "प्रविष्टि की तारीख",
      "receipt.repairN": "मरम्मत नंबर",
      "receipt.imei": "IMEI",
      "receipt.brandModel": "ब्रांड-मॉडल",
      "receipt.laptopSerialN": "लैपटॉप सीरियल नंबर",
      "receipt.warranty": "वारंटी",
      "receipt.equipmentCheck": "उपकरण जांच",
      "receipt.equipmentObs": "उपकरण रिपोर्ट",
      "receipt.repairObs": "मरम्मत रिपोर्ट",
      "receipt.services": "सेवाएं",
      "receipt.problem": "समस्या",
      "receipt.price": "मूल्य",
      "receipt.responsibleText": "हम वर्णित खराबियों की सहायता / मरम्मत के जिम्मेदार हैं।",
      "receipt.storageTitle": "भंडारण और लेने की शर्तें",
      "receipt.storageText1": "मरम्मत पूरी होने और",
      "receipt.storageText2": "द्वारा संबंधित सूचना के बाद साठ (60) दिनों की अधिकतम अवधि के भीतर उपकरण लिया जाना चाहिए। इस अवधि के बीतने के बाद, 61वें दिन से शुरू होकर, एक सौ बीस (120) दिनों की अधिकतम सीमा तक, 0.95 यूरो प्रति दिन की भंडारण फीस लागू की जाएगी, चाहे मरम्मत की गई हो या अनुमान अस्वीकार कर दिया गया हो।",
      "receipt.storageText3": "इस दस्तावेज को स्वीकार करने से, क्लाइंट घोषणा करता है कि उसने मरम्मत की शर्तों और नियमों को पढ़ा, समझा और स्वीकार किया है।",
      "receipt.repairReference": "मरम्मत का संदर्भ",
      "receipt.cutHere": "यहाँ काटें",
      "receipt.selectLanguage": "रसीद की भाषा चुनें",
      "receipt.selectLanguageDescription": "मुद्रित रसीद के लिए भाषा चुनें",
      "common.yes": "हाँ",
      "common.no": "नहीं",
      "form.warrantyUntil30Days": "30 दिनों तक वारंटी",
      "form.withoutWarranty": "वारंटी के बिना",
      "form.simCard": "SIM कार्ड",
      "form.simTray": "SIM ट्रे",
      "form.memoryCard": "मेमोरी कार्ड",
      "form.charger": "चार्जर",
      "form.battery": "बैटरी",
      "form.waterDamaged": "पानी से क्षतिग्रस्त",
    },
  }
  return translations[lang] || translations.en
}

// Language selection dialog component
function LanguageSelectionDialog({ 
  open, 
  onClose, 
  onSelect 
}: { 
  open: boolean
  onClose: () => void
  onSelect: (lang: "en" | "pt" | "de" | "fr" | "ur" | "pa" | "hi") => void 
}) {
  const languages = [
    { code: "en" as const, name: "English" },
    { code: "pt" as const, name: "Português" },
    { code: "de" as const, name: "Deutsch" },
    { code: "fr" as const, name: "Français" },
    { code: "ur" as const, name: "اردو" },
    { code: "pa" as const, name: "ਪੰਜਾਬੀ" },
    { code: "hi" as const, name: "हिंदी" },
  ]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white border-blue-200 text-black">
        <DialogHeader>
          <DialogTitle>Select Receipt Language</DialogTitle>
          <DialogDescription>
            Choose the language for the printed receipt
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-4">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="outline"
              className="w-full justify-start h-auto py-3"
              onClick={() => {
                onSelect(lang.code)
                onClose()
              }}
            >
              <span className="text-lg">{lang.name}</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Wrapper function that shows language selection dialog first
export function printReceiptWithLanguageSelection(
  tickets: any[], 
  preferredPrinter: string | null = null
) {
  // Validate tickets
  if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
    console.error("[printReceiptWithLanguageSelection] Invalid tickets parameter:", tickets)
    return
  }

  // Remove any existing dialog first
  const existingDialog = document.getElementById("receipt-language-dialog")
  if (existingDialog) {
    document.body.removeChild(existingDialog)
  }

  // Create a temporary dialog element
  const dialogId = "receipt-language-dialog-" + Date.now()
  const dialog = document.createElement("div")
  dialog.id = dialogId
  dialog.setAttribute("data-receipt-dialog", "true")
  
  // Set all styles directly
  Object.assign(dialog.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    zIndex: "99999",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%"
  })
  
  const contentDiv = document.createElement("div")
  Object.assign(contentDiv.style, {
    background: "white",
    padding: "24px",
    borderRadius: "8px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    position: "relative"
  })
  
  contentDiv.innerHTML = `
    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: #000;">Select Receipt Language</h2>
    <p style="font-size: 14px; color: #666; margin-bottom: 16px;">Choose the language for the printed receipt</p>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button data-lang="en" style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; text-align: left; font-size: 14px; color: #000; transition: background 0.2s;">English</button>
      <button data-lang="pt" style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; text-align: left; font-size: 14px; color: #000; transition: background 0.2s;">Português</button>
      <button data-lang="de" style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; text-align: left; font-size: 14px; color: #000; transition: background 0.2s;">Deutsch</button>
      <button data-lang="fr" style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; text-align: left; font-size: 14px; color: #000; transition: background 0.2s;">Français</button>
      <button data-lang="ur" style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; text-align: left; font-size: 14px; color: #000; transition: background 0.2s;">اردو</button>
      <button data-lang="pa" style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; text-align: left; font-size: 14px; color: #000; transition: background 0.2s;">ਪੰਜਾਬੀ</button>
      <button data-lang="hi" style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: white; cursor: pointer; text-align: left; font-size: 14px; color: #000; transition: background 0.2s;">हिंदी</button>
      <button data-cancel style="padding: 12px 16px; border: 1px solid #ddd; border-radius: 4px; background: #f5f5f5; cursor: pointer; text-align: center; font-size: 14px; margin-top: 8px; color: #000; transition: background 0.2s;">Cancel</button>
    </div>
  `
  
  dialog.appendChild(contentDiv)
  document.body.appendChild(dialog)

  // Add hover effects
  const buttons = contentDiv.querySelectorAll("button")
  buttons.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      if (btn.getAttribute("data-cancel")) {
        btn.style.background = "#e5e5e5"
      } else {
        btn.style.background = "#f5f5f5"
      }
    })
    btn.addEventListener("mouseleave", () => {
      if (btn.getAttribute("data-cancel")) {
        btn.style.background = "#f5f5f5"
      } else {
        btn.style.background = "white"
      }
    })
  })

  // Close dialog when clicking outside
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog)
      }
    }
  })

  // Handle button clicks
  const langButtons = contentDiv.querySelectorAll("button[data-lang], button[data-cancel]")
  langButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation()
      const lang = btn.getAttribute("data-lang") as "en" | "pt" | "de" | "fr" | "ur" | "pa" | "hi" | null
      if (document.body.contains(dialog)) {
        document.body.removeChild(dialog)
      }
      if (lang) {
        printReceiptForTickets(tickets, preferredPrinter, lang)
      }
    })
  })
}

// Exported function to print receipts from anywhere
// Updated: Uses "Client ID" instead of "Client NIF" and supports multiple languages
export function printReceiptForTickets(
  tickets: any[], 
  preferredPrinter: string | null = null,
  language: "en" | "pt" | "de" | "fr" | "ur" | "pa" | "hi" = "en"
) {
  // Validate tickets parameter
  if (!tickets || !Array.isArray(tickets) || tickets.length === 0) {
    console.error("[printReceiptForTickets] Invalid tickets parameter:", tickets)
    return
  }
  
  const user = getCurrentUser()
  const shopName = user?.shopName || user?.name || "Your Company Name"
  const contactNumber = user?.contactNumber || "N/A"
  
  // Get company info from localStorage or use defaults
  interface CompanyInfo {
    address?: string
    phone1?: string
    phone?: string
    phone2?: string
    email?: string
    companyEmail?: string
    website?: string
    vatNumber?: string
  }
  
  let companyInfo: CompanyInfo = {}
  try {
    const stored = localStorage.getItem("companyInfo")
    if (stored) {
      companyInfo = JSON.parse(stored) as CompanyInfo
    }
  } catch (e) {
    console.error("Error parsing company info:", e)
  }
  
  const companyAddress = companyInfo.address || "Avenida Almirente Reis n 23a, Lisboa, 1150-008"
  // Use only the admin's contact number from signup, not super admin's number
  // Priority: user's contactNumber > companyInfo.phone1 > companyInfo.phone > default
  const companyPhone1 = contactNumber && contactNumber !== "N/A" ? contactNumber : (companyInfo.phone1 || companyInfo.phone || "218870168")
  // Only show phone2 if explicitly set in companyInfo, don't use default super admin number
  const companyPhone2 = companyInfo.phone2 || null
  const companyEmail = companyInfo.email || companyInfo.companyEmail || "geral.tudo4mobile@gmail.com"
  const companyWebsite = companyInfo.website || "www.Tudo4Mobile.Pt"
  const companyVAT = companyInfo.vatNumber || "515570664"

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    console.error("Could not open print window")
    return
  }

  // Get translations for the selected language
  const t = getReceiptTranslations(language)
  
  // Function to generate receipt HTML for multiple devices added together
  const generateReceiptHTMLForMultipleDevices = (tickets: any[], copyType: 'CLIENT' | 'ADMIN' = 'CLIENT') => {
    if (tickets.length === 0) return ''
    
    const firstTicket = tickets[0]
    const ticketClientId = firstTicket.clientId || "N/A"
    const ticketCustomerName = firstTicket.customerName || "N/A"
    const ticketContact = firstTicket.contact || "N/A"
    const ticketReceivedBy = firstTicket.receivedBy || "N/A"
    const entryDate = new Date(firstTicket?.createdAt || Date.now())
    const formattedDate = entryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const formattedTime = entryDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    const copyLabel = copyType === 'CLIENT' ? t["receipt.clientCopy"] : t["receipt.adminCopy"]
    
    // Calculate total price
    const totalPrice = tickets.reduce((sum, ticket) => sum + (Number.parseFloat(ticket.price || 0)), 0)
    
    // Generate device list HTML - ensure all devices are included
    console.log(`[generateReceiptHTMLForMultipleDevices] Generating receipt for ${tickets.length} device(s)`)
    const devicesList = tickets.map((ticket, index) => {
      const ticketRepairNumber = ticket.repairNumber || "N/A"
      const ticketImeiNo = ticket.imeiNo || "000000000000000"
      const ticketBrand = ticket.brand || "N/A"
      const ticketModel = ticket.model || "N/A"
      const ticketSerialNo = ticket.serialNo || "-"
      const ticketWarrantyText = translateWarrantyValue(ticket.warranty, language)
      const ticketPrice = Number.parseFloat(ticket.price || 0).toFixed(2)
      
      console.log(`[generateReceiptHTMLForMultipleDevices] Adding Device ${index + 1}: ${ticketBrand} ${ticketModel} (Repair: ${ticketRepairNumber})`)
      
      return `
        <div style="margin: 6px 0; padding: 5px 0; border-bottom: 1.5px solid #ccc; background-color: #f5f5f5; page-break-inside: avoid;">
          <div style="font-weight: bold; margin: 0 0 4px 0; padding: 3px 6px; font-size: 7.5pt; line-height: 1.6; color: #000; background-color: #d0d0d0; border-left: 3px solid #0066cc;">Device ${index + 1}:</div>
          <div style="margin: 2px 0; padding: 1px 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.repairN"]}:</span> ${ticketRepairNumber}</div>
          <div style="margin: 2px 0; padding: 1px 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.imei"]}:</span> ${ticketImeiNo}</div>
          <div style="margin: 2px 0; padding: 1px 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.brandModel"]}:</span> ${ticketBrand} - ${ticketModel}</div>
          <div style="margin: 2px 0; padding: 1px 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.laptopSerialN"]}:</span> ${ticketSerialNo}</div>
          <div style="margin: 2px 0; padding: 1px 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.warranty"]}:</span> ${ticketWarrantyText}</div>
          <div style="margin: 2px 0; padding: 1px 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.price"]}:</span> €${ticketPrice}</div>
        </div>
      `
    }).join("")
    
    console.log(`[generateReceiptHTMLForMultipleDevices] Generated HTML for ${tickets.length} device(s)`)
    
    return `
      <div style="font-family: Arial, sans-serif; width: 100%; font-size: 6.5pt; line-height: 1.6; page-break-inside: avoid !important; margin: 0; padding: 0;">
        <div style="text-align: center; font-weight: bold; font-size: 7pt; margin: 0 0 3px 0; padding: 2px; background-color: #e0e0e0; border: 1px solid #999;">
          ${copyLabel}
        </div>
        <div style="display: table; width: 100%; margin: 0 0 4px 0; border-bottom: 1.5px solid #000; padding: 0 0 2px 0;">
          <div style="display: table-row;">
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 6px;">
              <div style="font-weight: bold; font-size: 8pt; margin: 0 0 2px 0; padding: 0; color: #000; line-height: 1.6;">${shopName}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyAddress}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyPhone1}${companyPhone2 ? `, ${companyPhone2}` : ""}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyEmail}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyWebsite}</div>
              <div style="margin: 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">VAT: ${companyVAT}</div>
            </div>
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-left: 6px;">
              <div style="font-weight: bold; font-size: 7pt; margin: 0 0 2px 0; padding: 0; color: #000; line-height: 1.6;">${t["receipt.clientId"]}: ${ticketClientId}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;"><strong>${t["receipt.name"]}:</strong> ${ticketCustomerName}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;"><strong>${t["receipt.clientPhone"]}:</strong> ${ticketContact}</div>
              <div style="margin: 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;"><strong>${t["receipt.receivedBy"] || "Device Received By"}:</strong> ${ticketReceivedBy}</div>
            </div>
          </div>
        </div>
        
        <div style="margin: 3px 0;">
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.entryDate"]}:</span> ${formattedDate} ${formattedTime}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">Number of Devices:</span> ${tickets.length}</div>
        </div>
        
        <div style="margin: 3px 0;">
          <div style="font-weight: bold; margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;">Devices:</div>
          ${devicesList}
        </div>
        
        <div style="margin: 3px 0; padding: 3px; background-color: #f0f0f0; text-align: center; font-weight: bold; font-size: 7pt; border: 1px solid #ddd;">
          <div style="font-size: 7pt; font-weight: bold;">Total Price: €${totalPrice.toFixed(2)}</div>
        </div>
        
        <div style="margin: 3px 0; padding: 3px; background-color: #f0f0f0; text-align: center; font-weight: bold; font-size: 6.5pt; border: 1px solid #ddd;">
          ${t["receipt.responsibleText"]}
        </div>
        
        <div style="margin-top: 3px; padding: 3px; background-color: #f9f9f9; font-size: 6pt; line-height: 1.3; border: 1px solid #ddd;">
          <div style="font-weight: bold; margin-bottom: 2px; font-size: 6.5pt;">${t["receipt.storageTitle"]}</div>
          <div style="text-align: justify; margin-bottom: 2px; font-size: 6pt;">
            ${t["receipt.storageText1"]} <strong>${shopName}</strong>.
          </div>
          <div style="text-align: justify; margin-bottom: 2px; font-size: 6pt;">
            ${t["receipt.storageText2"]}
          </div>
          <div style="text-align: justify; margin-bottom: 2px; font-size: 6pt;">
            ${t["receipt.storageText3"]}
          </div>
        </div>
      </div>
    `
  }
  
  // Function to generate a single receipt HTML
  const generateReceiptHTML = (ticket: any, copyType: 'CLIENT' | 'ADMIN' = 'CLIENT') => {
    // Validate ticket parameter
    if (!ticket || typeof ticket !== 'object') {
      console.error("[generateReceiptHTML] Invalid ticket parameter:", ticket)
      return '<div>Error: Invalid ticket data</div>'
    }
    
    // Extract all ticket properties upfront to avoid accessing ticket in template string
    const ticketClientId = ticket.clientId || "N/A"
    const ticketCustomerName = ticket.customerName || "N/A"
    const ticketContact = ticket.contact || "N/A"
    const ticketReceivedBy = ticket.receivedBy || "N/A"
    const ticketRepairNumber = ticket.repairNumber || "N/A"
    const ticketImeiNo = ticket.imeiNo || "000000000000000"
    const ticketBrand = ticket.brand || "N/A"
    const ticketModel = ticket.model || "N/A"
    const ticketSerialNo = ticket.serialNo || "-"
    // Translate warranty value to selected print language
    const ticketWarrantyText = translateWarrantyValue(ticket.warranty, language)
    const ticketSimCard = ticket.simCard ? t["common.yes"] : t["common.no"]
    const ticketSimTray = ticket.simTray ? t["common.yes"] : t["common.no"]
    const ticketMemoryCard = ticket.memoryCard ? t["common.yes"] : t["common.no"]
    const ticketCharger = ticket.charger ? t["common.yes"] : t["common.no"]
    const ticketBattery = ticket.battery ? t["common.yes"] : t["common.no"]
    const ticketWaterDamaged = ticket.waterDamaged ? t["common.yes"] : t["common.no"]
    const ticketEquipmentObs = ticket.equipmentObs || "-"
    const ticketRepairObs = ticket.repairObs || "-"
    const ticketProblem = ticket.problem || "-"
    const ticketPrice = Number.parseFloat(ticket.price || 0).toFixed(2)
    
    // Parse selectedServices if it's a string (from database JSON)
    let servicesArray = ticket.selectedServices
    if (typeof servicesArray === 'string') {
      try {
        servicesArray = JSON.parse(servicesArray)
      } catch (e) {
        console.error("[printReceiptForTickets] Error parsing selectedServices:", e)
        servicesArray = []
      }
    }
    
    const services = Array.isArray(servicesArray) 
      ? servicesArray.join(", ") 
      : (servicesArray || ticket.serviceName || t["common.notAvailable"] || "N/A")
    
    const copyLabel = copyType === 'CLIENT' ? t["receipt.clientCopy"] : t["receipt.adminCopy"]
    const entryDate = new Date(ticket?.createdAt || Date.now())
    const formattedDate = entryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const formattedTime = entryDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    
    return `
      <div style="font-family: Arial, sans-serif; width: 100%; font-size: 6.5pt; line-height: 1.6; page-break-inside: avoid !important; margin: 0; padding: 0;">
        <div style="text-align: center; font-weight: bold; font-size: 7pt; margin: 0 0 3px 0; padding: 2px; background-color: #e0e0e0; border: 1px solid #999;">
          ${copyLabel}
        </div>
        <div style="display: table; width: 100%; margin: 0 0 4px 0; border-bottom: 1.5px solid #000; padding: 0 0 2px 0;">
          <div style="display: table-row;">
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-right: 6px;">
              <div style="font-weight: bold; font-size: 8pt; margin: 0 0 2px 0; padding: 0; color: #000; line-height: 1.6;">${shopName}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyAddress}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyPhone1}${companyPhone2 ? `, ${companyPhone2}` : ""}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyEmail}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">${companyWebsite}</div>
              <div style="margin: 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;">VAT: ${companyVAT}</div>
            </div>
            <div style="display: table-cell; width: 50%; vertical-align: top; padding-left: 6px;">
              <div style="font-weight: bold; font-size: 7pt; margin: 0 0 2px 0; padding: 0; color: #000; line-height: 1.6;">${t["receipt.clientId"]}: ${ticketClientId}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;"><strong>${t["receipt.name"]}:</strong> ${ticketCustomerName}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;"><strong>${t["receipt.clientPhone"]}:</strong> ${ticketContact}</div>
              <div style="margin: 0; padding: 0; font-size: 6.5pt; color: #000; line-height: 1.6;"><strong>${t["receipt.receivedBy"] || "Device Received By"}:</strong> ${ticketReceivedBy}</div>
            </div>
          </div>
        </div>
        
        <div style="margin: 3px 0;">
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.entryDate"]}:</span> ${formattedDate} ${formattedTime}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.repairN"]}:</span> ${ticketRepairNumber}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.imei"]}:</span> ${ticketImeiNo}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.brandModel"]}:</span> ${ticketBrand} - ${ticketModel}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.laptopSerialN"]}:</span> ${ticketSerialNo}</div>
          <div style="margin: 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.warranty"]}:</span> ${ticketWarrantyText}</div>
        </div>
        
        <div style="margin: 3px 0;">
          <div style="font-weight: bold; margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;">${t["receipt.equipmentCheck"]}:</div>
          <div style="margin: 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["form.simCard"]}:</span> ${ticketSimCard} | <span style="font-weight: bold;">${t["form.simTray"]}:</span> ${ticketSimTray} | <span style="font-weight: bold;">${t["form.memoryCard"]}:</span> ${ticketMemoryCard} | <span style="font-weight: bold;">${t["form.charger"]}:</span> ${ticketCharger} | <span style="font-weight: bold;">${t["form.battery"]}:</span> ${ticketBattery} | <span style="font-weight: bold;">${t["form.waterDamaged"]}:</span> ${ticketWaterDamaged}</div>
        </div>
        
        <div style="margin: 3px 0;">
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.equipmentObs"]}:</span> ${ticketEquipmentObs}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.repairObs"]}:</span> ${ticketRepairObs}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.services"]}:</span> ${services}</div>
          <div style="margin: 0 0 2px 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.problem"]}:</span> ${ticketProblem}</div>
          <div style="margin: 0; padding: 0; font-size: 6.5pt; line-height: 1.6;"><span style="font-weight: bold;">${t["receipt.price"]}:</span> €${ticketPrice}</div>
        </div>
        
        <div style="margin: 3px 0; padding: 3px; background-color: #f0f0f0; text-align: center; font-weight: bold; font-size: 6.5pt; border: 1px solid #ddd;">
          ${t["receipt.responsibleText"]}
        </div>
        
        <div style="margin-top: 3px; padding: 3px; background-color: #f9f9f9; font-size: 6pt; line-height: 1.3; border: 1px solid #ddd;">
          <div style="font-weight: bold; margin-bottom: 2px; font-size: 6.5pt;">${t["receipt.storageTitle"]}</div>
          <div style="text-align: justify; margin-bottom: 2px; font-size: 6pt;">
            ${t["receipt.storageText1"]} <strong>${shopName}</strong>.
          </div>
          <div style="text-align: justify; margin-bottom: 2px; font-size: 6pt;">
            ${t["receipt.storageText2"]}
          </div>
          <div style="text-align: justify; margin-bottom: 2px; font-size: 6pt;">
            ${t["receipt.storageText3"]}
          </div>
          <div style="margin-top: 2px; font-weight: bold; font-size: 6.5pt;">${t["receipt.repairReference"]}: ${ticketRepairNumber}</div>
        </div>
      </div>
    `
  }

  // Generate receipts with 2 copies stacked vertically (CLIENT on top, ADMIN below) - compact A4 portrait, single page
  const validTickets = tickets.filter(ticket => ticket != null && typeof ticket === 'object')
  
  if (validTickets.length === 0) {
    console.error("[printReceiptForTickets] No valid tickets after filtering")
    return
  }
  
  console.log(`[printReceiptForTickets] Processing ${validTickets.length} ticket(s)`)
  
  // Group tickets by batchId if available, otherwise by clientId and customerName (devices added together)
  const groupedTickets: { [key: string]: any[] } = {}
  validTickets.forEach(ticket => {
    // Use batchId if available, otherwise use clientId and customerName
    const key = ticket.batchId || `${ticket.clientId || ''}_${ticket.customerName || ''}`
    if (!groupedTickets[key]) {
      groupedTickets[key] = []
    }
    groupedTickets[key].push(ticket)
    console.log(`[printReceiptForTickets] Added ticket ${ticket.repairNumber || ticket.id} to group ${key}`)
  })
  
  console.log(`[printReceiptForTickets] Grouped into ${Object.keys(groupedTickets).length} group(s)`)
  
  // Generate receipts - one receipt per group (devices added together share one receipt)
  const receiptsHTML = Object.values(groupedTickets).map(ticketGroup => {
    console.log(`[printReceiptForTickets] Processing group with ${ticketGroup.length} ticket(s)`)
    // Sort tickets by creation date to maintain order
    const sortedTickets = [...ticketGroup].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateA - dateB
    })
    
    // If multiple tickets in group, show all devices on one receipt
    if (sortedTickets.length > 1) {
      // Multiple devices added together - show on one receipt
      console.log(`[printReceiptForTickets] Generating multi-device receipt for ${sortedTickets.length} devices`)
      const firstTicket = sortedTickets[0]
      const clientCopy = generateReceiptHTMLForMultipleDevices(sortedTickets, 'CLIENT')
      const adminCopy = generateReceiptHTMLForMultipleDevices(sortedTickets, 'ADMIN')
      
      return `
        <div class="ticket-container" style="page-break-inside: avoid !important; page-break-after: avoid !important; break-inside: avoid !important; break-after: avoid !important; margin: 0 auto; padding: 0; width: 100%; display: flex; flex-direction: column; box-sizing: border-box; justify-content: center;">
          <!-- Client's Copy (Top) -->
          <div style="width: 100%; flex: 0 0 auto; margin-bottom: 0; padding-bottom: 0; page-break-inside: avoid !important; break-inside: avoid !important;">
            ${clientCopy}
          </div>
          
          <!-- Tearing Line and Gap (Center) -->
          <div style="width: 100%; flex: 0 0 auto; margin: 4mm 0; padding: 2mm 0; text-align: center; position: relative; page-break-inside: avoid !important; break-inside: avoid !important;">
            <!-- Cutting line with dotted pattern -->
            <div style="width: 100%; margin: 0; padding: 0.5mm 0; position: relative;">
              <!-- Dotted cutting line -->
              <div style="border-top: 2px dotted #000; border-bottom: 2px dotted #000; margin: 0 auto; padding: 1mm 0; width: 100%; position: relative;">
                <div style="text-align: center; font-size: 6pt; color: #000; margin: 0.3mm 0; font-weight: bold; letter-spacing: 2px;"> ${t["receipt.cutHere"]} </div>
              </div>
              <!-- Additional dotted line for better visibility -->
              <div style="border-top: 1px dotted #666; margin: 0.3mm auto 0; width: 100%;"></div>
            </div>
          </div>
          
          <!-- Admin's Copy (Bottom) -->
          <div style="width: 100%; flex: 0 0 auto; margin-top: 0; padding-top: 0; margin-bottom: 0; page-break-inside: avoid !important; break-inside: avoid !important;">
            ${adminCopy}
          </div>
        </div>
      `
    } else {
      // Single device - show individual receipt
      const ticket = sortedTickets[0]
      const clientCopy = generateReceiptHTML(ticket, 'CLIENT')
      const adminCopy = generateReceiptHTML(ticket, 'ADMIN')
      
      return `
        <div class="ticket-container" style="page-break-inside: avoid !important; page-break-after: avoid !important; break-inside: avoid !important; break-after: avoid !important; margin: 0 auto; padding: 0; width: 100%; display: flex; flex-direction: column; box-sizing: border-box; justify-content: center;">
          <!-- Client's Copy (Top) -->
          <div style="width: 100%; flex: 0 0 auto; margin-bottom: 0; padding-bottom: 0; page-break-inside: avoid !important; break-inside: avoid !important;">
            ${clientCopy}
          </div>
          
          <!-- Tearing Line and Gap (Center) -->
          <div style="width: 100%; flex: 0 0 auto; margin: 4mm 0; padding: 2mm 0; text-align: center; position: relative; page-break-inside: avoid !important; break-inside: avoid !important;">
            <!-- Cutting line with dotted pattern -->
            <div style="width: 100%; margin: 0; padding: 0.5mm 0; position: relative;">
              <!-- Dotted cutting line -->
              <div style="border-top: 2px dotted #000; border-bottom: 2px dotted #000; margin: 0 auto; padding: 1mm 0; width: 100%; position: relative;">
                <div style="text-align: center; font-size: 6pt; color: #000; margin: 0.3mm 0; font-weight: bold; letter-spacing: 2px;"> ${t["receipt.cutHere"]} </div>
              </div>
              <!-- Additional dotted line for better visibility -->
              <div style="border-top: 1px dotted #666; margin: 0.3mm auto 0; width: 100%;"></div>
            </div>
          </div>
          
          <!-- Admin's Copy (Bottom) -->
          <div style="width: 100%; flex: 0 0 auto; margin-top: 0; padding-top: 0; margin-bottom: 0; page-break-inside: avoid !important; break-inside: avoid !important;">
            ${adminCopy}
          </div>
        </div>
      `
    }
  }).join("")
  
  const ticketsHTML = receiptsHTML
  
  const printHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Repair Ticket Receipt</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 3mm 0;
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 3mm 0;
              }
              body {
                margin: 0;
                padding: 0 30px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                overflow: hidden;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
              }
              .no-print {
                display: none !important;
              }
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              html, body {
                overflow: hidden;
                page-break-after: avoid;
              }
              /* Hide all links and URLs in print */
              a {
                text-decoration: none !important;
                color: inherit !important;
              }
              a::after {
                content: "" !important;
              }
              a[href]::after {
                content: "" !important;
              }
              /* Prevent page breaks - force everything on one page */
              .ticket-container {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                break-inside: avoid !important;
                break-after: avoid !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                margin: 0 auto !important;
              }
              /* Prevent any element from breaking across pages */
              div, table, tr, td {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              /* Ensure table doesn't break */
              table {
                page-break-inside: avoid !important;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 6.5pt;
              line-height: 1.1;
              margin: 0;
              padding: 0 30px;
              color: #000;
              width: 100%;
              height: 100vh;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .ticket-container {
              width: 100%;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: center;
              margin: 0 auto;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 10px 20px;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              z-index: 1000;
            }
            .print-button:hover {
              background: #0056b3;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
          </style>
          <script>
            // Remove all links and URLs before printing
            window.onbeforeprint = function() {
              // Remove href attributes from all links to prevent URLs from printing
              document.querySelectorAll('a').forEach(function(link) {
                link.removeAttribute('href');
                link.style.textDecoration = 'none';
                link.style.color = 'inherit';
              });
            };
            
            // Also check after load
            window.onload = function() {
              setTimeout(function() {
                // Remove href attributes from all links
                document.querySelectorAll('a').forEach(function(link) {
                  link.removeAttribute('href');
                  link.style.textDecoration = 'none';
                  link.style.color = 'inherit';
                });
              }, 100);
            };
          </script>
      </head>
      <body>
        <button class="no-print print-button" onclick="window.print()">Print Receipt</button>
        ${ticketsHTML}
      </body>
    </html>
  `

  printWindow.document.write(printHTML)
  printWindow.document.close()
  printWindow.document.title = "Repair Ticket Receipt"

  // Remove any URLs and href attributes from the document before printing
  setTimeout(() => {
    try {
      printWindow.document.querySelectorAll('a').forEach((link: any) => {
        // Remove href attribute to prevent URLs from appearing in print
        link.removeAttribute('href')
        link.style.textDecoration = 'none'
        link.style.color = 'inherit'
      })
    } catch (e) {
      // Ignore if querySelector fails
    }
  }, 100)

  setTimeout(() => {
    try {
      printWindow.focus()
      
      // Store printer selection from print dialog
      // Note: We can't programmatically select a printer due to browser security,
      // but we can guide the user and remember their choice
      const printHandler = () => {
        // After printing, the browser will remember the last selected printer
        // This helps with automatic printer detection for future prints
        if (preferredPrinter) {
          console.log(`Attempting to print to: ${preferredPrinter}`)
        }
      }
      
      printWindow.addEventListener('beforeprint', printHandler)
      printWindow.print()
      
      // Remove event listener after print
      setTimeout(() => {
        printWindow.removeEventListener('beforeprint', printHandler)
      }, 1000)
      
      // For receipt printers, keep the window open longer to allow print job to complete
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.close()
        }
      }, 2000)
    } catch (error) {
      console.error("Print error:", error)
      // Note: toast might not be available in this context
      try {
        if (typeof window !== 'undefined') {
          const { toast } = require('sonner')
          toast.error("Failed to print. Please check your printer connection.")
        }
      } catch (e) {
        // Ignore if toast is not available
      }
    }
  }, 500)
}

// Helper function to print directly to a receipt printer (if Web Serial API is available)
export async function printToReceiptPrinter(tickets: any[]) {
  // Check if Web Serial API is available (Chrome/Edge only)
  if (!('serial' in navigator)) {
    console.warn("Web Serial API not available. Falling back to window.print()")
    printReceiptWithLanguageSelection(tickets)
    return
  }

  try {
    // Request access to serial port
    const port = await (navigator as any).serial.requestPort()
    await port.open({ baudRate: 9600 }) // Common baud rate for receipt printers

    // Generate ESC/POS commands for receipt
    // This is a basic example - you'll need to customize based on your printer
    const encoder = new TextEncoder()
    
    for (const ticket of tickets) {
      // ESC/POS commands
      const commands = [
        '\x1B\x40', // Initialize printer
        '\x1B\x61\x01', // Center align
        '=== RECEIPT ===\n',
        '\x1B\x61\x00', // Left align
        `Repair #: ${ticket.repairNumber || 'N/A'}\n`,
        `Customer: ${ticket.customerName || 'N/A'}\n`,
        `IMEI: ${ticket.imeiNo || 'N/A'}\n`,
        `Device: ${ticket.brand || 'N/A'} ${ticket.model || 'N/A'}\n`,
        `Price: €${ticket.price || '0.00'}\n`,
        '\x1B\x64\x05', // Feed 5 lines
        '\x1D\x56\x00', // Cut paper
      ].join('')

      const data = encoder.encode(commands)
      const writer = port.writable?.getWriter()
      if (writer) {
        await writer.write(data)
        writer.releaseLock()
      }
    }

    await port.close()
    toast.success("Receipt printed successfully!")
  } catch (error: any) {
    console.error("Error printing to receipt printer:", error)
    toast.error("Failed to print to receipt printer. Using browser print instead.")
    // Fallback to regular print with language selection
    printReceiptWithLanguageSelection(tickets)
  }
}
