"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useTranslation } from "@/components/language-provider"
import { toast } from "sonner"
import { getUserData, setUserData } from "@/lib/storage"
import { exportToCSV } from "@/lib/export-utils"
import { printReceiptWithLanguageSelection } from "@/components/new-repair-ticket-form"

type SearchRepairTicketsProps = {
  initialStatusFilter?: string
}

export function SearchRepairTickets({ initialStatusFilter }: SearchRepairTicketsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [tickets, setTickets] = useState<any[]>([])
  const [filteredTickets, setFilteredTickets] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [editingTicket, setEditingTicket] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<any>({
    customerName: "",
    contact: "",
    receivedBy: "",
    imeiNo: "",
    brand: "",
    model: "",
    serialNo: "",
    warranty: "",
    simCard: false,
    simTray: false,
    memoryCard: false,
    charger: false,
    battery: false,
    waterDamaged: false,
    equipmentObs: "",
    phoneIssue: "",
    repairObs: "",
    selectedServices: "" as string | string[],
    condition: "",
    problem: "",
    price: "",
    budget: "",
    priceType: "budget" as "budget" | "price",
    status: "pending",
  })
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchInputFocused, setSearchInputFocused] = useState(false)

  // Helper function to format client ID to 4-digit format
  const formatClientId = (clientId: string | null | undefined): string => {
    if (!clientId) return "-"
    
    // Try to extract any number from the client ID
    // Match CLI- followed by any digits, or just any digits
    const match = clientId.match(/CLI-?(\d+)/i) || clientId.match(/(\d+)/)
    
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num >= 1) {
        // Ensure number is within valid range (1-9999) and format to 4 digits
        const validNum = Math.min(num, 9999)
        return `CLI-${String(validNum).padStart(4, "0")}`
      }
    }
    
    // If no number found, return as is (will be migrated later)
    return clientId
  }

  // Helper function to translate service names
  const translateServiceName = (serviceName: string): string => {
    if (!serviceName || serviceName.trim() === "") return serviceName
    
    const trimmedService = serviceName.trim()
    const lowerServiceName = trimmedService.toLowerCase()
    // Check if "OK" suffix is present (preserve it)
    const hasOkSuffix = /\s+ok\s*$/i.test(trimmedService)
    // Remove "OK" suffix if present (for matching purposes)
    const withoutOk = lowerServiceName.replace(/\s+ok\s*$/, "").trim()
    
    // Map common service names to translation keys (expanded with variations)
    const serviceMap: Record<string, string> = {
      "LCD": "service.lcd",
      "lcd": "service.lcd",
      "Battery": "service.battery",
      "battery": "service.battery",
      "BATTERY NEW": "service.battery",
      "battery new": "service.battery",
      "Charging Port": "service.chargingPort",
      "charging port": "service.chargingPort",
      "chargingport": "service.chargingPort",
      "CHARGING BOARD": "service.chargingPort",
      "charging board": "service.chargingPort",
      "CHARGING BOARD CHANGE": "service.chargingPort",
      "charging board change": "service.chargingPort",
      "Microphone": "service.microphone",
      "microphone": "service.microphone",
      "Ear speaker": "service.earSpeaker",
      "ear speaker": "service.earSpeaker",
      "earspeaker": "service.earSpeaker",
      "Back cover": "service.backCover",
      "back cover": "service.backCover",
      "backcover": "service.backCover",
      "BACK GLASS": "service.backCover",
      "back glass": "service.backCover",
      "BACK GLASS OK": "service.backCover",
      "back glass ok": "service.backCover",
      "Wifi/Bluetooth": "service.wifiBluetooth",
      "wifi/bluetooth": "service.wifiBluetooth",
      "wifi": "service.wifiBluetooth",
      "bluetooth": "service.wifiBluetooth",
      "Network": "service.network",
      "network": "service.network",
      "NETWORK JECK": "service.network",
      "network jeck": "service.network",
      "NETWORK FLEX JECK": "service.network",
      "network flex jeck": "service.network",
      "Software": "service.software",
      "software": "service.software",
      "Shut off": "service.shutOff",
      "shut off": "service.shutOff",
      "shutoff": "service.shutOff",
      // Combined services
      "CHANGE TOUCH+LCD": "service.lcd",
      "change touch+lcd": "service.lcd",
      "TOUCH+LCD CHANGE": "service.lcd",
      "touch+lcd change": "service.lcd",
      "THOUCH+LCD CHANGE": "service.lcd",
      "thouch+lcd change": "service.lcd",
      "LCD CHANGE": "service.lcd",
      "lcd change": "service.lcd",
      "LCD CHANGE OK": "service.lcd",
      "lcd change ok": "service.lcd",
      "LCD NEW": "service.lcd",
      "lcd new": "service.lcd",
      "LCD OK": "service.lcd",
      "lcd ok": "service.lcd",
      "ONLY LCD OK": "service.lcd",
      "only lcd ok": "service.lcd",
      "CHANGE LCD+TAMPA": "service.lcd",
      "change lcd+tampa": "service.lcd",
      "ONLY CLEAN WATER": "service.software",
      "only clean water": "service.software",
      "ONLY CLEANING": "service.software",
      "only cleaning": "service.software",
      "CLEANING": "service.software",
      "cleaning": "service.software",
      "CLEAN": "service.software",
      "clean": "service.software",
      "CAMERA PANA": "service.camera",
      "camera pana": "service.camera",
    }
    
    // Try exact match first (check original uppercase, normalized lowercase, with and without "OK")
    const originalWithoutOk = trimmedService.replace(/\s+ok\s*$/i, "").trim()
    const translationKey = serviceMap[trimmedService] || serviceMap[trimmedService.toUpperCase()] || 
                          serviceMap[lowerServiceName] || serviceMap[withoutOk] ||
                          serviceMap[originalWithoutOk] || serviceMap[originalWithoutOk.toUpperCase()]
    if (translationKey) {
      const translated = t(translationKey)
      if (translated && translated !== translationKey) {
        // Preserve "OK" suffix if it was in the original
        return hasOkSuffix ? `${translated} OK` : translated
      }
    }
    
    // Try case-insensitive match (check both lowercase and uppercase variations)
    for (const [key, value] of Object.entries(serviceMap)) {
      const lowerKey = key.toLowerCase()
      if (key === trimmedService || key === trimmedService.toUpperCase() ||
          lowerKey === lowerServiceName || lowerKey === withoutOk ||
          key.toLowerCase() === lowerServiceName || key.toLowerCase() === withoutOk) {
        const translated = t(value)
        if (translated && translated !== value) {
          // Preserve "OK" suffix if it was in the original
          return hasOkSuffix ? `${translated} OK` : translated
        }
      }
    }
    
    // Try partial match for service names that might contain the service
    for (const [key, value] of Object.entries(serviceMap)) {
      if (lowerServiceName.includes(key.toLowerCase()) || key.toLowerCase().includes(withoutOk) || withoutOk.includes(key.toLowerCase())) {
        const translated = t(value)
        if (translated && translated !== value) {
          // Preserve "OK" suffix if it was in the original
          return hasOkSuffix ? `${translated} OK` : translated
        }
      }
    }
    
    // If no translation found, return original (which already includes "OK" if present)
    return trimmedService
  }

  // Helper function to translate multiple services (comma-separated or array)
  const translateServices = (services: string | string[] | null | undefined): string => {
    if (!services) return "-"
    
    let servicesArray: string[] = []
    if (typeof services === 'string') {
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(services)
        servicesArray = Array.isArray(parsed) ? parsed : [services]
      } catch {
        // If not JSON, split by comma
        servicesArray = services.split(',').map(s => s.trim()).filter(s => s)
      }
    } else if (Array.isArray(services)) {
      servicesArray = services
    }
    
    if (servicesArray.length === 0) return "-"
    
    // Translate each service and join
    return servicesArray.map(service => translateServiceName(service)).join(", ")
  }

  // Helper function to translate common phone issues/problems
  const translateProblem = (problem: string | null | undefined): string => {
    if (!problem || problem.trim() === "") return "-"
    
    const problemText = problem.trim()
    const lowerProblem = problemText.toLowerCase()
    
    // Map common problem descriptions to translation keys
    // Expanded list with more variations (including uppercase)
    const problemMap: Record<string, string> = {
      // Screen issues (lowercase)
      "screen broken": "problem.screenBroken",
      "broken screen": "problem.screenBroken",
      "cracked screen": "problem.crackedScreen",
      "screen cracked": "problem.crackedScreen",
      "screen not working": "problem.screenNotWorking",
      "display not working": "problem.displayNotWorking",
      "touch not working": "problem.touchNotWorking",
      "touchscreen not working": "problem.touchNotWorking",
      "touch problem": "problem.touchNotWorking",
      "lcd not work": "problem.screenNotWorking",
      "lcd brokin": "problem.screenBroken",
      "lcd broken": "problem.screenBroken",
      "lcd": "problem.screenBroken",
      "screen change": "problem.screenBroken",
      "lcd pani": "problem.screenBroken",
      // Screen issues (uppercase)
      "SCREEN BROKEN": "problem.screenBroken",
      "BROKEN SCREEN": "problem.screenBroken",
      "CRACKED SCREEN": "problem.crackedScreen",
      "SCREEN CRACKED": "problem.crackedScreen",
      "SCREEN NOT WORKING": "problem.screenNotWorking",
      "DISPLAY NOT WORKING": "problem.displayNotWorking",
      "TOUCH NOT WORKING": "problem.touchNotWorking",
      "TOUCHSCREEN NOT WORKING": "problem.touchNotWorking",
      "TOUCH PROBLEM": "problem.touchNotWorking",
      "TOUCH": "problem.touchNotWorking",
      "LCD NOT WORK": "problem.screenNotWorking",
      "LCD BROKIN": "problem.screenBroken",
      "LCD BROKEN": "problem.screenBroken",
      "LCD": "problem.screenBroken",
      "LCD BLINKING": "problem.screenNotWorking",
      "LOGO STUCK": "problem.screenNotWorking",
      "SCREEN CHANGE": "problem.screenBroken",
      
      // Charging issues (lowercase)
      "battery not charging": "problem.batteryNotCharging",
      "charging issue": "problem.chargingIssue",
      "not charging": "problem.notCharging",
      "charger not working": "problem.chargingIssue",
      "charging problem": "problem.chargingIssue",
      "no charge": "problem.notCharging",
      "battery problem": "problem.batteryNotCharging",
      // Charging issues (uppercase)
      "BATTERY NOT CHARGING": "problem.batteryNotCharging",
      "CHARGING ISSUE": "problem.chargingIssue",
      "NOT CHARGING": "problem.notCharging",
      "CHARGER NOT WORKING": "problem.chargingIssue",
      "CHARGING PROBLEM": "problem.chargingIssue",
      "NO CHARGE": "problem.notCharging",
      "BATTERY PROBLEM": "problem.batteryNotCharging",
      
      // Water damage
      "water damage": "problem.waterDamage",
      "water damaged": "problem.waterDamaged",
      "liquid damage": "problem.waterDamage",
      "water damage change lcd": "problem.waterDamage",
      
      // Component issues
      "speaker not working": "problem.speakerNotWorking",
      "microphone not working": "problem.microphoneNotWorking",
      "camera not working": "problem.cameraNotWorking",
      "wifi not working": "problem.wifiNotWorking",
      "bluetooth not working": "problem.bluetoothNotWorking",
      "back glass": "problem.screenBroken",
      "network flex jeck broken": "problem.networkIssue",
      "network flex jeck broken both side": "problem.networkIssue",
      "lcd partido": "problem.screenBroken",
      "camera pana": "problem.cameraNotWorking",
      
      // System issues
      "network issue": "problem.networkIssue",
      "software issue": "problem.softwareIssue",
      "phone not turning on": "problem.phoneNotTurningOn",
      "won't turn on": "problem.wontTurnOn",
      "not turning on": "problem.wontTurnOn",
      "dead": "problem.dead",
      "dead repair": "problem.deadRepair",
      "repair": "problem.deadRepair",
      "power button not working": "problem.powerButtonNotWorking",
      "home button not working": "problem.homeButtonNotWorking",
      
      // Combined issues (lowercase)
      "touch+lcd": "problem.touchNotWorking",
      "touch +lcd": "problem.touchNotWorking",
      "touch+lcd inside broken": "problem.touchNotWorking",
      "touch+lcd problem": "problem.touchNotWorking",
      "touch+lcd+tampa broken": "problem.touchNotWorking",
      "only lcd problem": "problem.screenNotWorking",
      // Combined issues (uppercase)
      "TOUCH+LCD": "problem.touchNotWorking",
      "TOUCH +LCD": "problem.touchNotWorking",
      "TOUCH+LCD INSIDE BROKEN": "problem.touchNotWorking",
      "TOUCH+LCD PROBLEM": "problem.touchNotWorking",
      "TOUCH+LCD+TAMPA BROKEN": "problem.touchNotWorking",
      "ONLY LCD PROBLEM": "problem.screenNotWorking",
    }
    
    // Try exact match first (case-insensitive)
    for (const [key, translationKey] of Object.entries(problemMap)) {
      if (lowerProblem === key.toLowerCase()) {
        const translated = t(translationKey)
        if (translated && translated !== translationKey) {
          return translated
        }
      }
    }
    
    // Try partial match - only if the key is a significant part of the problem
    // This prevents short words like "repair" from matching "dead repair"
    for (const [key, translationKey] of Object.entries(problemMap)) {
      const lowerKey = key.toLowerCase()
      // Only match if the key phrase is at least 3 characters and is contained in the problem
      // OR if the problem is contained in the key (for exact phrases)
      if (lowerKey.length >= 3 && lowerProblem.includes(lowerKey)) {
        const translated = t(translationKey)
        if (translated && translated !== translationKey) {
          return translated
        }
      }
    }
    
    // ALWAYS return original text if no translation found - this ensures old data is displayed
    return problemText
  }

  // Helper function to sort tickets by clientId (CLI-0001, CLI-0002, etc.) then by createdAt
  const sortTicketsByClientId = (ticketsArray: any[]): any[] => {
    return ticketsArray.sort((a: any, b: any) => {
      const getClientIdNum = (clientId: string | null | undefined): number => {
        if (!clientId) return 999999
        const match = clientId.match(/^CLI-(\d{1,4})$/)
        return match ? parseInt(match[1], 10) : 999999
      }
      const aNum = getClientIdNum(a.clientId)
      const bNum = getClientIdNum(b.clientId)
      if (aNum !== bNum) return aNum - bNum
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }

  // Function to migrate client IDs to 4-digit format
  const migrateClientIds = async () => {
    try {
      if (!currentUser?.id) {
        toast.error(t("error.userNotFound"))
        return
      }

      toast.loading(t("search.migrating"), { id: "migrate-ids" })

      const response = await fetch("/api/migrate/client-ids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || t("search.migrated").replace("{count}", data.migrated.toString()), { id: "migrate-ids" })
        // Reload tickets
        const reloadResponse = await fetch(`/api/repairs?userId=${currentUser.id}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          const ticketsArray = Array.isArray(reloadData.tickets) ? reloadData.tickets : []
          const sortedTickets = sortTicketsByClientId(ticketsArray)
          setTickets(sortedTickets)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t("search.migrationFailed"), { id: "migrate-ids" })
      }
    } catch (error: any) {
      console.error("[SearchRepairTickets] Error migrating client IDs:", error)
      toast.error(t("search.migrationFailed"), { id: "migrate-ids" })
    }
  }

  // Function to consolidate client IDs - ensure one client has only one client ID
  const consolidateClientIds = async () => {
    try {
      if (!currentUser?.id) {
        toast.error(t("error.userNotFound"))
        return
      }

      toast.loading(t("search.consolidating"), { id: "consolidate-ids" })

      const response = await fetch("/api/migrate/consolidate-client-ids", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(
          data.message || 
          t("search.consolidated").replace("{consolidated}", data.consolidated.toString()).replace("{updated}", data.updated.toString()), 
          { id: "consolidate-ids", duration: 5000 }
        )
        // Reload tickets
        const reloadResponse = await fetch(`/api/repairs?userId=${currentUser.id}`)
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json()
          const ticketsArray = Array.isArray(reloadData.tickets) ? reloadData.tickets : []
          const sortedTickets = sortTicketsByClientId(ticketsArray)
          setTickets(sortedTickets)
        }
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || t("search.consolidationFailed"), { id: "consolidate-ids" })
      }
    } catch (error: any) {
      console.error("[SearchRepairTickets] Error consolidating client IDs:", error)
      toast.error(t("search.consolidationFailed"), { id: "consolidate-ids" })
    }
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user from sessionStorage
        const userData = sessionStorage.getItem("user")
        if (userData) {
          const user = JSON.parse(userData)
          setCurrentUser(user)
          
          // Load tickets from API instead of localStorage
          const response = await fetch(`/api/repairs?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            const ticketsArray = Array.isArray(data.tickets) ? data.tickets : []
            console.log(`[SearchRepairTickets] Loaded ${ticketsArray.length} tickets from API`)
            // Sort tickets by newest first (descending by createdAt)
            const sortedTickets = ticketsArray.sort((a: any, b: any) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
            setTickets(sortedTickets)
            // Also set filteredTickets initially (will be updated by useEffect)
            setFilteredTickets(sortedTickets)
            console.log(`[SearchRepairTickets] Set ${sortedTickets.length} tickets and filteredTickets`)
          } else {
            const errorData = await response.json().catch(() => ({}))
            console.error("[SearchRepairTickets] Failed to load tickets from API:", response.status, errorData)
            setTickets([])
            setFilteredTickets([])
          }
        }
      } catch (error) {
        console.error("[SearchRepairTickets] Error loading tickets:", error)
        setTickets([])
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    const statusFromUrl = searchParams.get("status")
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl)
    } else if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter)
    }
  }, [searchParams, initialStatusFilter])

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      handleSearch(searchTerm, searchType)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchType])

  useEffect(() => {
    // Ensure tickets is an array before filtering
    const ticketsArray = Array.isArray(tickets) ? tickets : []
    console.log(`[SearchRepairTickets] Filtering ${ticketsArray.length} tickets, statusFilter=${statusFilter}, searchTerm="${searchTerm}"`)
    let filtered = [...ticketsArray]
    if (searchTerm.trim() && searchType !== "date") {
      const lowercaseTerm = searchTerm.toLowerCase()
      filtered = filtered.filter((ticket: any) => {
        try {
          switch (searchType) {
            case "id":
              return (ticket.repairNumber?.toLowerCase()?.includes(lowercaseTerm) || false) || 
                     (ticket.id?.toLowerCase()?.includes(lowercaseTerm) || false)
            case "clientId":
              return (ticket.clientId?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                     (formatClientId(ticket.clientId)?.toLowerCase()?.includes(lowercaseTerm) || false)
            case "name":
              return ticket.customerName?.toLowerCase()?.includes(lowercaseTerm) || false
            case "contact":
              return ticket.contact?.toLowerCase()?.includes(lowercaseTerm) || false
            case "imei":
              return ticket.imeiNo?.toLowerCase()?.includes(lowercaseTerm) || false
            case "model":
              return ticket.model?.toLowerCase()?.includes(lowercaseTerm) || false
            default:
              // Search in all allowed fields: ID, Client ID, IMEI, Contact, name, model
              return (
                (ticket.repairNumber?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                (ticket.id?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                (ticket.clientId?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                (formatClientId(ticket.clientId)?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                (ticket.customerName?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                (ticket.contact?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                (ticket.imeiNo?.toLowerCase()?.includes(lowercaseTerm) || false) ||
                (ticket.model?.toLowerCase()?.includes(lowercaseTerm) || false)
              )
          }
        } catch (error) {
          console.error("[SearchRepairTickets] Error filtering ticket:", error, ticket)
          return false
        }
      })
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket: any) => {
        const ticketStatus = ticket.status?.toLowerCase() || ""
        const filterStatus = statusFilter.toLowerCase()
        // Handle both "not_ok" and "not-ok" variations
        if (filterStatus === "not_ok") {
          return ticketStatus === "not_ok" || ticketStatus === "NOT_OK" || ticketStatus === "not-ok" || ticketStatus === "not ok"
        }
        return ticketStatus === filterStatus
      })
    }
    if (dateFilter && searchType === "date") {
      filtered = filtered.filter((ticket: any) => {
        if (!ticket.createdAt) return false
        try {
          const ticketDate = new Date(ticket.createdAt)
          if (isNaN(ticketDate.getTime())) return false
          const ticketDateStr = ticketDate.toISOString().split('T')[0]
          return ticketDateStr === dateFilter
        } catch (error) {
          return false
        }
      })
    }
    // Sort filtered tickets by newest first (descending by createdAt)
    const sortedFiltered = filtered.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
    console.log(`[SearchRepairTickets] After filtering: ${sortedFiltered.length} tickets`)
    setFilteredTickets(sortedFiltered)
    
    // Scroll to first result when search is performed
    if (filtered.length > 0 && (searchTerm.trim() || statusFilter !== "all" || dateFilter)) {
      setTimeout(() => {
        const firstRow = document.querySelector('[data-ticket-row]') as HTMLElement
        if (firstRow) {
          firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [tickets, searchTerm, searchType, statusFilter, dateFilter])

  const handleSearch = (term: string, type: string) => {
    setSearchTerm(term)
    setSearchType(type)
    
    if (term.trim().length > 0) {
      const lowercaseTerm = term.toLowerCase()
      const suggestionList: any[] = []
      const seen = new Set<string>()
      
      const ticketsArray = Array.isArray(tickets) ? tickets : []
      ticketsArray.forEach((ticket: any) => {
        try {
          let matchValue = ""
          let displayText = ""
          
          switch (type) {
            case "name":
              if (ticket.customerName?.toLowerCase()?.includes(lowercaseTerm)) {
                matchValue = ticket.customerName
                displayText = `${ticket.customerName || ""} - ${ticket.model || ""}`
              }
              break
            case "contact":
              if (ticket.contact?.toLowerCase()?.includes(lowercaseTerm)) {
                matchValue = ticket.contact
                displayText = `${ticket.contact || ""} - ${ticket.customerName || ""}`
              }
              break
            case "imei":
              if (ticket.imeiNo?.toLowerCase()?.includes(lowercaseTerm)) {
                matchValue = ticket.imeiNo
                displayText = `${ticket.imeiNo || ""} - ${ticket.model || ""}`
              }
              break
            case "model":
              if (ticket.model?.toLowerCase()?.includes(lowercaseTerm)) {
                matchValue = ticket.model
                displayText = `${ticket.model || ""} - ${ticket.customerName || ""}`
              }
              break
            case "clientId":
              if (ticket.clientId?.toLowerCase()?.includes(lowercaseTerm) || formatClientId(ticket.clientId)?.toLowerCase()?.includes(lowercaseTerm)) {
                matchValue = formatClientId(ticket.clientId)
                displayText = `${formatClientId(ticket.clientId) || ""} - ${ticket.customerName || ""}`
              }
              break
            case "service":
              if (ticket.serviceName?.toLowerCase()?.includes(lowercaseTerm)) {
                matchValue = ticket.serviceName
                displayText = `${ticket.serviceName || ""} - ${ticket.customerName || ""}`
              }
              break
            case "repairNumber":
              if (ticket.repairNumber?.toLowerCase()?.includes(lowercaseTerm)) {
                matchValue = ticket.repairNumber
                displayText = `${ticket.repairNumber || ""} - ${ticket.customerName || ""}`
              }
              break
            case "all":
              if (ticket.customerName?.toLowerCase()?.includes(lowercaseTerm) && !seen.has(ticket.customerName)) {
                seen.add(ticket.customerName)
                suggestionList.push({ value: ticket.customerName, display: ticket.customerName, type: "name" })
              }
              if (ticket.clientId && (ticket.clientId?.toLowerCase()?.includes(lowercaseTerm) || formatClientId(ticket.clientId)?.toLowerCase()?.includes(lowercaseTerm))) {
                const clientIdFormatted = formatClientId(ticket.clientId)
                if (!seen.has(clientIdFormatted)) {
                  seen.add(clientIdFormatted)
                  suggestionList.push({ value: clientIdFormatted, display: `${clientIdFormatted || ""} - ${ticket.customerName || ""}`, type: "clientId" })
                }
              }
              if (ticket.model?.toLowerCase()?.includes(lowercaseTerm) && !seen.has(ticket.model)) {
                seen.add(ticket.model)
                suggestionList.push({ value: ticket.model, display: `${ticket.model || ""} - ${ticket.customerName || ""}`, type: "model" })
              }
              if (ticket.imeiNo?.toLowerCase()?.includes(lowercaseTerm) && !seen.has(ticket.imeiNo)) {
                seen.add(ticket.imeiNo)
                suggestionList.push({ value: ticket.imeiNo, display: `${ticket.imeiNo || ""} - ${ticket.model || ""}`, type: "imei" })
              }
              if (ticket.repairNumber?.toLowerCase()?.includes(lowercaseTerm) && !seen.has(ticket.repairNumber)) {
                seen.add(ticket.repairNumber)
                suggestionList.push({ value: ticket.repairNumber, display: `${ticket.repairNumber || ""} - ${ticket.customerName || ""}`, type: "repairNumber" })
              }
              break
          }
          
          if (matchValue && !seen.has(matchValue) && type !== "all") {
            seen.add(matchValue)
            suggestionList.push({ value: matchValue, display: displayText, type: type, ticket: ticket })
          }
        } catch (error) {
          console.error("[SearchRepairTickets] Error processing ticket in handleSearch:", error, ticket)
          // Continue processing other tickets
        }
      })
      
      setSuggestions(suggestionList.slice(0, 8))
      setShowSuggestions(suggestionList.length > 0 && searchInputFocused)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }
  
  const handleSuggestionClick = (suggestion: any) => {
    setSearchTerm(suggestion.value)
    setSearchType(suggestion.type)
    setShowSuggestions(false)
    setSearchInputFocused(false)
  }

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status)
  }

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const userId = currentUser?.id
      if (!userId) {
        toast.error(t("error.userNotFound"))
        return
      }

      // Update via API
      const response = await fetch(`/api/repairs/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      })
      
      if (response.ok) {
        // Reload tickets from API
        const reloadResponse = await fetch(`/api/repairs?userId=${userId}`)
        if (reloadResponse.ok) {
          const data = await reloadResponse.json()
            const ticketsArray = Array.isArray(data.tickets) ? data.tickets : []
            setTickets(sortTicketsByClientId(ticketsArray))
          
          // Update filtered tickets
          setFilteredTickets(ticketsArray.filter((t: any) => {
            if (statusFilter !== "all" && t.status?.toLowerCase() !== statusFilter.toLowerCase()) return false
            if (searchTerm.trim()) {
              const term = searchTerm.toLowerCase()
              return t.customerName?.toLowerCase().includes(term) || t.model?.toLowerCase().includes(term) || t.imeiNo?.toLowerCase().includes(term)
            }
            return true
          }))
          
          toast.success(t("success.statusUpdated") || "Status updated successfully")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || t("error.ticketStatusUpdateFailed"))
      }
    } catch (error: any) {
      console.error("[SearchRepairTickets] Error updating ticket status:", error)
      toast.error(error.message || t("error.ticketStatusUpdateFailed"))
    }
  }

  const handleEditClick = (ticket: any) => {
    setEditingTicket(ticket)
    // Parse selectedServices if it's a string
    let servicesArray = ticket.selectedServices
    if (typeof servicesArray === 'string') {
      try {
        servicesArray = JSON.parse(servicesArray)
      } catch {
        servicesArray = []
      }
    }
    if (!Array.isArray(servicesArray)) {
      servicesArray = ticket.serviceName ? [ticket.serviceName] : []
    }
    
    // If repairObs exists, use it for Services field (store as string to preserve formatting)
    // Priority: repairObs > selectedServices > serviceName
    let servicesForField: string | string[] = servicesArray
    if (ticket.repairObs && ticket.repairObs.trim() !== "") {
      // Store repairObs as string to preserve multi-line and formatting
      servicesForField = ticket.repairObs
    } else if (servicesArray.length === 0 && ticket.serviceName) {
      servicesForField = [ticket.serviceName]
    }
    
    setEditFormData({
      customerName: ticket.customerName || "",
      contact: ticket.contact || "",
      receivedBy: ticket.receivedBy || "",
      imeiNo: ticket.imeiNo || "",
      brand: ticket.brand || "",
      model: ticket.model || "",
      serialNo: ticket.serialNo || "",
      warranty: ticket.warranty || "Without Warranty",
      simCard: ticket.simCard ?? false,
      simTray: ticket.simTray ?? false,
      memoryCard: ticket.memoryCard ?? false,
      charger: ticket.charger ?? false,
      battery: ticket.battery ?? false,
      waterDamaged: ticket.waterDamaged ?? false,
      equipmentObs: ticket.equipmentObs || "",
      phoneIssue: ticket.phoneIssue || "",
      repairObs: ticket.repairObs || "",
      selectedServices: servicesForField,
      condition: ticket.condition || "",
      problem: ticket.problem || "",
      price: ticket.price || "",
      budget: ticket.budget || "",
      priceType: ticket.priceType || "budget",
      status: ticket.status || "pending",
    })
    setIsEditDialogOpen(true)
  }

  const handleModelClick = (ticket: any) => {
    router.push(`/tickets/${ticket.id}`)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTicket) return

    try {
      const userId = currentUser?.id
      if (!userId) {
        toast.error(t("error.userNotFound"))
        return
      }

      // Validate IMEI if provided
      if (editFormData.imeiNo && editFormData.imeiNo.trim() !== "" && editFormData.imeiNo.length !== 15) {
        toast.error(t("error.imei.exact") || "IMEI Number must be exactly 15 digits")
        return
      }

      // Prepare update data - convert price and budget to numbers, handle selectedServices
      const updateData: any = {
        userId,
        customerName: editFormData.customerName || null,
        contact: editFormData.contact || null,
        receivedBy: editFormData.receivedBy || null,
        imeiNo: editFormData.imeiNo && editFormData.imeiNo.trim() !== "" ? editFormData.imeiNo.trim() : null,
        brand: editFormData.brand || null,
        model: editFormData.model || null,
        serialNo: editFormData.serialNo || null,
        warranty: editFormData.warranty || null,
        simCard: editFormData.simCard ?? false,
        simTray: editFormData.simTray ?? false,
        memoryCard: editFormData.memoryCard ?? false,
        charger: editFormData.charger ?? false,
        battery: editFormData.battery ?? false,
        waterDamaged: editFormData.waterDamaged ?? false,
        equipmentObs: editFormData.equipmentObs || null,
        phoneIssue: editFormData.phoneIssue || null,
        // Repair Observations field - prioritize repairObs field, fallback to selectedServices for backward compatibility
        repairObs: (() => {
          // First, use repairObs field if it has a value
          if (editFormData.repairObs && editFormData.repairObs.trim()) {
            return editFormData.repairObs.trim()
          }
          
          // Fallback: Get value from selectedServices field (for backward compatibility)
          let servicesValue = ""
          if (typeof editFormData.selectedServices === 'string') {
            servicesValue = editFormData.selectedServices.trim()
          } else if (Array.isArray(editFormData.selectedServices) && editFormData.selectedServices.length > 0) {
            servicesValue = editFormData.selectedServices.join(", ").trim()
          }
          
          return servicesValue || null
        })(),
        // Save selectedServices separately
        selectedServices: (() => {
          if (typeof editFormData.selectedServices === 'string') {
            return editFormData.selectedServices.trim() ? [editFormData.selectedServices.trim()] : []
          } else if (Array.isArray(editFormData.selectedServices)) {
            return editFormData.selectedServices
          }
          return []
        })(),
        condition: editFormData.condition || null,
        problem: editFormData.problem || null,
        price: editFormData.priceType === "price" && editFormData.price ? Number.parseFloat(editFormData.price) : null,
        budget: editFormData.priceType === "budget" && editFormData.budget ? Number.parseFloat(editFormData.budget) : null,
        priceType: editFormData.priceType || "budget",
        status: editFormData.status || "pending",
      }

      // Update via API
      console.log("[SearchRepairTickets] Updating ticket:", editingTicket.id, "with data:", updateData)
      const response = await fetch(`/api/repairs/${editingTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      console.log("[SearchRepairTickets] Update response status:", response.status, response.ok)

      if (response.ok) {
        // Close form first
        setIsEditDialogOpen(false)
        setEditingTicket(null)
        
        // Reload tickets from API to show updated data
        const reloadResponse = await fetch(`/api/repairs?userId=${userId}`)
        if (reloadResponse.ok) {
          const data = await reloadResponse.json()
          const ticketsArray = Array.isArray(data.tickets) ? data.tickets : []
          
          // Parse selectedServices JSON strings if needed
          const parsedTickets = ticketsArray.map((t: any) => {
            if (t.selectedServices && typeof t.selectedServices === 'string') {
              try {
                t.selectedServices = JSON.parse(t.selectedServices)
              } catch {
                // Keep as is if parsing fails
              }
            }
            return t
          })
          
          setTickets(sortTicketsByClientId(parsedTickets))
          
          // Update filtered tickets with parsed data
          setFilteredTickets(parsedTickets.filter((t: any) => {
            if (statusFilter !== "all" && t.status?.toLowerCase() !== statusFilter.toLowerCase()) return false
            if (searchTerm.trim()) {
              const term = searchTerm.toLowerCase()
              return t.customerName?.toLowerCase().includes(term) || t.model?.toLowerCase().includes(term) || t.imeiNo?.toLowerCase().includes(term)
            }
            return true
          }))
        }
        toast.success(t("success.deviceUpdated") || "Device updated successfully")
      } else {
        const data = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[SearchRepairTickets] Update failed:", {
          status: response.status,
          statusText: response.statusText,
          error: data.error || data,
          updateData
        })
        throw new Error(data.error || data.message || t("error.deviceUpdateFailed"))
      }
    } catch (error: any) {
      console.error("[SearchRepairTickets] Error updating ticket:", error)
      console.error("[SearchRepairTickets] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      toast.error(error.message || t("error.deviceUpdateFailed"))
    }
  }

  const handleDelete = async (ticketId: string) => {
    try {
      const userId = currentUser?.id
      if (!userId) {
        toast.error(t("error.userNotFound"))
        return
      }

      // Confirm deletion
      if (typeof window !== "undefined") {
        const confirmed = window.confirm(t("trash.confirmDelete") || "Are you sure you want to delete this device? It will be moved to trash.")
        if (!confirmed) return
      }

      // Soft delete via PUT (set deleted = true)
      const response = await fetch(`/api/repairs/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          deleted: true,
          deletedAt: new Date().toISOString()
        }),
      })

      if (response.ok) {
        // Remove from local state immediately
        setTickets(prev => prev.filter(t => String(t.id) !== String(ticketId)))
        
        // Also update localStorage
        const storedTickets = await getUserData<any[]>("repairTickets", [])
        const updatedTickets = Array.isArray(storedTickets) 
          ? storedTickets.filter(t => String(t.id) !== String(ticketId))
          : []
        await setUserData("repairTickets", updatedTickets)
        
        toast.success(t("success.deviceMovedToTrash") || "Device moved to trash successfully")
      } else {
        const data = await response.json()
        const errorMessage = data.error || t("error.deviceDeleteFailed") || "Failed to delete device"
        console.error("[SearchRepairTickets] Delete failed:", errorMessage)
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error("[SearchRepairTickets] Error deleting ticket:", error)
      toast.error(error.message || t("error.deviceDeleteFailed") || "Failed to delete device")
    }
  }

  const getStatusColor = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || ""
    switch (normalizedStatus) {
      case "pending":
      case "pending":
        return "bg-yellow-500 text-white border-2 border-yellow-600 font-semibold"
      case "not_ok":
      case "not_ok":
        return "bg-red-500 text-white border-2 border-red-600 font-semibold"
      case "completed":
      case "completed":
        return "bg-green-500 text-white border-2 border-green-600 font-semibold"
      case "delivered":
      case "delivered":
        return "bg-blue-500 text-white border-2 border-blue-600 font-semibold"
      default:
        return "bg-gray-500 text-white border-2 border-gray-600 font-semibold"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-xl border border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-800 border-b-2 border-blue-300 dark:border-gray-700 rounded-t-lg p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl sm:text-2xl font-bold text-black dark:text-white flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center ring-2 ring-blue-200 dark:ring-gray-700 shadow-lg">
                <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {t("search.title")}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={migrateClientIds}
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg text-xs px-3 py-1.5"
                title={t("search.migrateTooltip")}
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t("search.migrateIds")}
              </Button>
              <Button
                onClick={consolidateClientIds}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg text-xs px-3 py-1.5 ml-2"
                title={t("search.consolidateTooltip")}
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t("search.consolidateIds")}
              </Button>
              <Button
                onClick={() => {
                  if (filteredTickets.length === 0) {
                    toast.error(t("search.noDataToExport"))
                    return
                  }
                  const headers = [
                    { key: "createdAt" as const, label: "Date" },
                    { key: "clientId" as const, label: "Client ID" },
                    { key: "customerName" as const, label: "Client Name" },
                    { key: "contact" as const, label: "Contact" },
                    { key: "model" as const, label: "Model" },
                    { key: "imeiNo" as const, label: "IMEI" },
                    { key: "selectedServices" as const, label: "Services" },
                    { key: "status" as const, label: "Status" },
                    { key: "price" as const, label: "Price (€)" },
                    { key: "repairNumber" as const, label: "Repair Number" },
                  ]
                  const formattedTickets = filteredTickets.map((ticket: any) => {
                    // Use equipment observations for Services column
                    const services = ticket.equipmentObs || ticket.equipmentObservations || ""
                    return {
                      createdAt: new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                      clientId: formatClientId(ticket.clientId),
                      customerName: ticket.customerName || "",
                      contact: ticket.contact || "",
                      model: ticket.model || "",
                      imeiNo: ticket.imeiNo || "",
                      selectedServices: services,
                      status: ticket.status === "pending" || ticket.status === "PENDING" ? t("status.pending") :
                             ticket.status === "not_ok" || ticket.status === "NOT_OK" ? (t("status.notOk") || "Not OK") :
                             ticket.status === "completed" || ticket.status === "COMPLETED" ? t("status.completed") :
                             ticket.status === "delivered" || ticket.status === "DELIVERED" ? t("status.delivered") :
                             ticket.status?.replace("_", " ") || "",
                      price: Number.parseFloat(ticket.price || 0).toFixed(2),
                      repairNumber: ticket.repairNumber || "",
                    }
                  })
                  exportToCSV(formattedTickets, "devices", headers)
                  toast.success(t("search.exportSuccess"))
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg text-xs px-3 py-1.5"
              >
                <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t("common.exportToExcel") || "Export to Excel"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 text-black dark:text-white">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search" className="font-medium text-black dark:text-white">{t("search.searchLabel")}</Label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchType === "date" ? (
                  <Input
                    id="search"
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value || "")}
                    className="pl-10 !bg-white dark:!bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white focus:border-blue-500 dark:focus:border-gray-600"
                  />
                ) : (
                  <Input
                    id="search"
                    placeholder={t("search.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value, searchType)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        // Scroll to first result after search
                        setTimeout(() => {
                          const firstRow = document.querySelector('[data-ticket-row]') as HTMLElement
                          if (firstRow) {
                            firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
                          }
                        }, 100)
                      }
                    }}
                    onFocus={() => {
                      setSearchInputFocused(true)
                      if (suggestions.length > 0) setShowSuggestions(true)
                    }}
                    onBlur={() => setTimeout(() => { setSearchInputFocused(false); setShowSuggestions(false) }, 200)}
                    className="pl-10 !bg-white dark:!bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-gray-600"
                  />
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 !bg-white dark:!bg-gray-800 border-2 border-blue-200 dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer border-b border-blue-100 dark:border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span className="text-sm font-medium text-black dark:text-white">{suggestion.display}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchType" className="font-medium text-black dark:text-white">{t("search.searchBy")}</Label>
              <Select value={searchType} onValueChange={(value) => {
                setSearchType(value)
                if (value === "date") {
                  setSearchTerm("")
                } else {
                  setDateFilter("")
                  if (searchTerm.trim()) handleSearch(searchTerm, value)
                }
              }}>
                <SelectTrigger id="searchType" className="!bg-white dark:!bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white">
                  <SelectValue placeholder={t("search.field.all")} />
                </SelectTrigger>
                <SelectContent className="!bg-white dark:!bg-gray-800 border-blue-200 dark:border-gray-700" side="bottom" sideOffset={4}>
                  <SelectItem value="all" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("search.field.all")}</SelectItem>
                  <SelectItem value="id" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">ID</SelectItem>
                  <SelectItem value="clientId" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("form.clientId") || "Client ID"}</SelectItem>
                  <SelectItem value="name" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("search.field.name")}</SelectItem>
                  <SelectItem value="contact" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("search.field.contact")}</SelectItem>
                  <SelectItem value="imei" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("search.field.imei")}</SelectItem>
                  <SelectItem value="model" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("search.field.model")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusFilter" className="font-medium text-black dark:text-white">{t("search.filterByStatus")}</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger id="statusFilter" className="!bg-white dark:!bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white">
                  <SelectValue placeholder={t("status.all")} />
                </SelectTrigger>
                <SelectContent className="!bg-white dark:!bg-gray-800 border-blue-200 dark:border-gray-700" side="bottom" sideOffset={4}>
                  <SelectItem value="all" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("search.allStatuses") || t("status.all")}</SelectItem>
                  <SelectItem value="pending" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("status.pending")}</SelectItem>
                  <SelectItem value="not_ok" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("status.notOk") || "Not OK"}</SelectItem>
                  <SelectItem value="completed" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("status.completed")}</SelectItem>
                  <SelectItem value="delivered" className="text-black dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700">{t("status.delivered")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xl border-2 border-blue-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-800 border-b-2 border-blue-300 dark:border-gray-700 rounded-t-lg p-6 shadow-sm">
          <CardTitle className="text-2xl font-bold text-black dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center ring-2 ring-blue-200 dark:ring-gray-700 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            {t("common.allDevices")} ({filteredTickets.length} {filteredTickets.length === 1 ? t("search.results.device") : t("search.results.devices")})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-black dark:text-white">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border border-blue-200 dark:border-gray-700">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-black dark:text-gray-300 text-lg font-medium">
                {tickets.length === 0 ? t("search.noDevicesYet") : t("search.noDevicesMatch")}
              </p>
            </div>
          ) : (
            <div className="-mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full border-collapse table-fixed text-xs">
                <thead>
                  <tr className="bg-blue-50 dark:bg-gray-800 border-b-2 border-blue-300 dark:border-gray-700">
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[8%]">{t("table.date")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-0.5 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[6%]">{t("table.clientId") || t("form.clientId") || "Client ID"}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[13%]">{t("table.client") || t("form.clientName")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[10%]">{t("table.contact")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[12%]">{t("table.model")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[11%]">{t("table.imei")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[11%]">{t("table.phoneIssue")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[11%]">{t("table.serviceDone")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[9%]">{t("table.status")}</th>
                    <th className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-left text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[8%]">{t("table.price")}</th>
                    <th className="px-0.5 py-1.5 text-center text-[10px] font-semibold text-black dark:text-white uppercase tracking-wider w-[6%]">{t("table.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-200 dark:divide-gray-700">
                  {filteredTickets.map((ticket, index) => (
                      <tr
                        key={ticket.id}
                        data-ticket-row
                        onClick={() => handleModelClick(ticket)}
                        className={`hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${
                          index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-blue-50/30 dark:bg-gray-800/50"
                        }`}
                      >
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] text-black dark:text-white">
                          <div className="flex flex-col gap-0.5">
                            <div className="text-black dark:text-white leading-tight">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                            {(ticket.status === "DELIVERED" || ticket.status === "delivered") && ticket.deliveredDate && (
                              <div className="text-[9px] text-blue-600 dark:text-white font-semibold leading-tight">
                                Out: {new Date(ticket.deliveredDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-0.5 py-1.5 text-[10px] font-semibold text-black dark:text-white">
                          <span className="text-blue-600 dark:text-blue-400 break-words break-all" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            {formatClientId(ticket.clientId)}
                          </span>
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] font-medium text-black dark:text-white break-words">
                          {ticket.customerName}
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] text-black dark:text-gray-300 break-words">
                          {ticket.contact || "-"}
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] font-semibold text-black dark:text-white break-words">
                          {ticket.model || "-"}
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[10px] text-black dark:text-gray-300 font-mono break-words">
                          {ticket.imeiNo || "-"}
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] text-black dark:text-gray-300 break-words">
                          {(() => {
                            // Show Phone Issue - translate phoneIssue field
                            const phoneIssue = ticket.phoneIssue || ""
                            if (phoneIssue && phoneIssue.trim() !== "") {
                              return translateProblem(phoneIssue)
                            }
                            // Fallback to equipmentObs for backward compatibility (old devices)
                            const mobileCondition = ticket.equipmentObs || ticket.equipmentObservations || ticket.condition || ""
                            if (mobileCondition && mobileCondition.trim() !== "") {
                              return translateProblem(mobileCondition)
                            }
                            // Fallback to problem if no condition is available (for backward compatibility)
                            return ticket.problem && ticket.problem.trim() !== "" ? translateProblem(ticket.problem) : "-"
                          })()}
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] text-black dark:text-gray-300 break-words">
                          {(() => {
                            // Get services from repairObs, selectedServices, or serviceName
                            let services: string | string[] | null = null
                            
                            if (ticket.repairObs) {
                              // If repairObs exists, translate it
                              return translateServices(ticket.repairObs)
                            }
                            
                            if (ticket.selectedServices) {
                              try {
                                services = typeof ticket.selectedServices === 'string' 
                                  ? JSON.parse(ticket.selectedServices) 
                                  : ticket.selectedServices
                              } catch {
                                // If parsing fails, try as comma-separated string
                                services = ticket.selectedServices
                              }
                            } else if (ticket.serviceName) {
                              services = ticket.serviceName
                            }
                            
                            return translateServices(services)
                          })()}
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={ticket.status?.toLowerCase() || "pending"} 
                            onValueChange={(value) => {
                              updateTicketStatus(ticket.id, value)
                            }}
                            disabled={ticket.status === "DELIVERED" || ticket.status === "delivered" || ticket.status === "OUT" || ticket.status === "out"}
                          >
                            <SelectTrigger className={`${getStatusColor(ticket.status)} text-[10px] px-1.5 py-0.5 h-auto w-full cursor-pointer !bg-opacity-100 ${(ticket.status === "DELIVERED" || ticket.status === "delivered" || ticket.status === "OUT" || ticket.status === "out") ? "opacity-50 cursor-not-allowed" : ""}`} style={{ backgroundColor: ticket.status?.toLowerCase() === 'pending' ? '#eab308' : ticket.status?.toLowerCase() === 'not_ok' ? '#ef4444' : ticket.status?.toLowerCase() === 'completed' ? '#22c55e' : ticket.status?.toLowerCase() === 'delivered' ? '#3b82f6' : '#6b7280', color: 'white', borderColor: ticket.status?.toLowerCase() === 'pending' ? '#ca8a04' : ticket.status?.toLowerCase() === 'not_ok' ? '#dc2626' : ticket.status?.toLowerCase() === 'completed' ? '#16a34a' : ticket.status?.toLowerCase() === 'delivered' ? '#2563eb' : '#4b5563' }}>
                              <SelectValue>
                                {ticket.status === "pending" || ticket.status === "PENDING" ? t("status.pending") :
                                 ticket.status === "not_ok" || ticket.status === "NOT_OK" ? (t("status.notOk") || "Not OK") :
                                 ticket.status === "completed" || ticket.status === "COMPLETED" ? t("status.completed") :
                                 ticket.status === "delivered" || ticket.status === "DELIVERED" ? t("status.delivered") :
                                 ticket.status?.replace("_", " ") || t("status.pending")}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-700 z-50">
                              <SelectItem value="pending" className="text-black dark:text-white cursor-pointer">{t("status.pending")}</SelectItem>
                              <SelectItem value="not_ok" className="text-black dark:text-white cursor-pointer">{t("status.notOk") || "Not OK"}</SelectItem>
                              <SelectItem value="completed" className="text-black dark:text-white cursor-pointer">{t("status.completed")}</SelectItem>
                              <SelectItem value="delivered" className="text-black dark:text-white cursor-pointer">{t("status.delivered")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border-r border-blue-300 dark:border-gray-700 px-1 py-1.5 text-[11px] text-black dark:text-white whitespace-nowrap">
                          €{Number.parseFloat(ticket.price || 0).toFixed(2)}
                        </td>
                        <td className="px-0.5 py-1.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-0.5 flex-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (ticket.status === "DELIVERED" || ticket.status === "delivered" || ticket.status === "CANCELLED" || ticket.status === "cancelled") {
                                  toast.error(t("error.cannotEditDelivered") || "Cannot edit tickets that are delivered or cancelled")
                                  return
                                }
                                handleEditClick(ticket)
                              }}
                              disabled={ticket.status === "DELIVERED" || ticket.status === "delivered" || ticket.status === "CANCELLED" || ticket.status === "cancelled"}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 h-6 w-6 p-0 min-w-0 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                printReceiptWithLanguageSelection([ticket])
                              }}
                              className="text-green-600 hover:text-green-800 hover:bg-green-100 h-6 w-6 p-0 min-w-0 flex-shrink-0"
                              title="Print Receipt"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (ticket.status === "DELIVERED" || ticket.status === "delivered" || ticket.status === "CANCELLED" || ticket.status === "cancelled") {
                                      toast.error(t("error.cannotDeleteDelivered") || "Cannot delete tickets that are delivered or cancelled")
                                      e.preventDefault()
                                    }
                                  }}
                                  disabled={ticket.status === "DELIVERED" || ticket.status === "delivered" || ticket.status === "CANCELLED" || ticket.status === "cancelled"}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-100 h-6 w-6 p-0 min-w-0 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-blue-200 text-black">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-black">{t("common.confirmDelete")}</AlertDialogTitle>
                                  <AlertDialogDescription className="text-black">
                                    {t("common.deleteConfirmation")}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white border-blue-300 text-black hover:bg-blue-50">{t("common.cancel")}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(ticket.id)}
                                    className="bg-red-600 text-white hover:bg-red-700"
                                  >
                                    {t("common.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border-blue-200 dark:border-gray-700 text-black dark:text-white">
          <DialogHeader className="pt-4 pb-2">
            <DialogTitle className="text-black dark:text-white text-xl sm:text-2xl font-bold">{t("ticket.edit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edit-customerName" className="text-black dark:text-white">{t("form.clientName")}</Label>
                <Input id="edit-customerName" value={editFormData.customerName || ""} onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })} className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact" className="text-black dark:text-white">{t("table.contact")}</Label>
                <Input id="edit-contact" value={editFormData.contact || ""} onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })} className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-receivedBy" className="text-black dark:text-white">{t("form.receivedBy")}</Label>
                <Input id="edit-receivedBy" value={editFormData.receivedBy || ""} onChange={(e) => setEditFormData({ ...editFormData, receivedBy: e.target.value })} className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-imeiNo" className="text-black dark:text-white">{t("form.imei")}</Label>
                <Input 
                  id="edit-imeiNo" 
                  value={editFormData.imeiNo || ""} 
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '') // Only allow digits
                    if (value.length <= 15) {
                      setEditFormData({ ...editFormData, imeiNo: value })
                    }
                  }}
                  maxLength={15}
                  className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white" 
                />
                {editFormData.imeiNo && editFormData.imeiNo.length !== 15 && (
                  <p className="text-xs text-red-600 dark:text-red-400">{t("error.imei.exact") || "IMEI Number must be exactly 15 digits"}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-brand" className="text-black dark:text-white">{t("form.brand")}</Label>
                <Input id="edit-brand" value={editFormData.brand || ""} onChange={(e) => setEditFormData({ ...editFormData, brand: e.target.value })} className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model" className="text-black dark:text-white">{t("form.model")}</Label>
                <Input id="edit-model" value={editFormData.model || ""} onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })} className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-serialNo" className="text-black dark:text-white">{t("form.laptopSerialNumber")}</Label>
                <Input id="edit-serialNo" value={editFormData.serialNo || ""} onChange={(e) => setEditFormData({ ...editFormData, serialNo: e.target.value })} className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-budget" className="text-black dark:text-white">{t("form.budget")} / {t("form.price")}</Label>
                <div className="flex gap-2">
                  <Select
                    value={editFormData.priceType || "budget"}
                    onValueChange={(value: "budget" | "price") => {
                      setEditFormData({ ...editFormData, priceType: value })
                    }}
                  >
                    <SelectTrigger className="w-[120px] bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-700">
                      <SelectItem value="budget" className="text-black dark:text-white">{t("form.budget")}</SelectItem>
                      <SelectItem value="price" className="text-black dark:text-white">{t("form.price")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="edit-budget"
                    type="number"
                    step="0.01"
                    value={editFormData.priceType === "price" ? editFormData.price || "" : editFormData.budget || ""}
                    onChange={(e) => {
                      if (editFormData.priceType === "price") {
                        setEditFormData({ ...editFormData, price: e.target.value })
                      } else {
                        setEditFormData({ ...editFormData, budget: e.target.value })
                      }
                    }}
                    className="flex-1 bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-warranty" className="text-black dark:text-white">{t("form.warranty")}</Label>
                <label className="flex items-center gap-2 text-sm text-black dark:text-white hover:text-black dark:hover:text-white cursor-pointer">
                  <input
                    type="checkbox"
                    id="edit-warranty"
                    className="h-4 w-4 cursor-pointer bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 rounded"
                    checked={(() => {
                      const warranty = editFormData.warranty || ""
                      return warranty.toLowerCase().includes("warranty") && warranty.toLowerCase().includes("30")
                    })()}
                    onChange={(e) => {
                      const warrantyValue = e.target.checked ? t("form.warrantyUntil30Days") : t("form.withoutWarranty")
                      setEditFormData({ 
                        ...editFormData, 
                        warranty: warrantyValue
                      })
                    }}
                  />
                  <span>{t("form.warrantyUntil30Days")}</span>
                </label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status" className="text-black dark:text-white">{t("table.status")}</Label>
                <Select value={editFormData.status || "pending"} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                  <SelectTrigger id="edit-status" className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-700" side="bottom" sideOffset={4}>
                    <SelectItem value="pending" className="text-black dark:text-white">{t("status.pending")}</SelectItem>
                    <SelectItem value="not_ok" className="text-black dark:text-white">{t("status.notOk") || "Not OK"}</SelectItem>
                    <SelectItem value="completed" className="text-black dark:text-white">{t("status.completed")}</SelectItem>
                    <SelectItem value="delivered" className="text-black dark:text-white">{t("status.delivered")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-equipmentObs" className="text-black dark:text-white">Mobile Conditions (On Arrival)</Label>
              <Textarea 
                id="edit-equipmentObs" 
                value={editFormData.equipmentObs || ""} 
                onChange={(e) => setEditFormData({ ...editFormData, equipmentObs: e.target.value })} 
                className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white min-h-[80px]" 
                placeholder="Enter mobile conditions on arrival"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phoneIssue" className="text-black dark:text-white">{t("table.phoneIssue") || "Phone Issue"}</Label>
              <Textarea 
                id="edit-phoneIssue" 
                value={editFormData.phoneIssue || ""} 
                onChange={(e) => setEditFormData({ ...editFormData, phoneIssue: e.target.value })} 
                className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white min-h-[80px]" 
                placeholder="Enter phone issue details"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-selectedServices" className="text-black dark:text-white">{t("table.serviceDone")}</Label>
              <Textarea 
                id="edit-selectedServices" 
                value={(() => {
                  // Get value - handle both string and array formats
                  if (typeof editFormData.selectedServices === 'string') {
                    return editFormData.selectedServices
                  } else if (Array.isArray(editFormData.selectedServices)) {
                    return editFormData.selectedServices.join(", ")
                  }
                  return ""
                })()}
                onChange={(e) => {
                  const value = e.target.value
                  // Store as string to allow unlimited text input with formatting preserved
                  // This will be saved to repairObs when form is submitted
                  setEditFormData({ ...editFormData, selectedServices: value })
                }} 
                className="bg-white dark:bg-gray-800 border-blue-300 dark:border-gray-700 text-black dark:text-white min-h-[120px] resize-y w-full" 
                placeholder="Enter services or repair observations (comma-separated or multiple lines)"
                disabled={false}
                readOnly={false}
              />
            </div>

            {/* Equipment Check */}
            <div className="space-y-2">
              <Label className="text-black dark:text-white">{t("form.equipmentCheck")}</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer">
                  <input type="checkbox" checked={editFormData.simCard} onChange={(e) => setEditFormData({ ...editFormData, simCard: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm text-black dark:text-white">{t("form.simCard")}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer">
                  <input type="checkbox" checked={editFormData.simTray} onChange={(e) => setEditFormData({ ...editFormData, simTray: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm text-black dark:text-white">{t("form.simTray")}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer">
                  <input type="checkbox" checked={editFormData.memoryCard} onChange={(e) => setEditFormData({ ...editFormData, memoryCard: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm text-black dark:text-white">{t("form.memoryCard")}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer">
                  <input type="checkbox" checked={editFormData.charger} onChange={(e) => setEditFormData({ ...editFormData, charger: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm text-black dark:text-white">{t("form.charger")}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer">
                  <input type="checkbox" checked={editFormData.battery} onChange={(e) => setEditFormData({ ...editFormData, battery: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm text-black dark:text-white">{t("form.battery")}</span>
                </label>
                <label className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700 hover:border-red-500 dark:hover:border-red-400 cursor-pointer">
                  <input type="checkbox" checked={editFormData.waterDamaged} onChange={(e) => setEditFormData({ ...editFormData, waterDamaged: e.target.checked })} className="h-4 w-4" />
                  <span className="text-sm text-black dark:text-white">{t("form.waterDamaged")}</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingTicket(null) }} className="border-blue-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700">{t("form.cancel")}</Button>
              <Button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300">{t("common.saveChanges")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

