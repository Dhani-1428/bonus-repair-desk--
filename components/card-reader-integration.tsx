"use client"

import { useState } from "react"
import { useCardReader } from "@/hooks/use-card-reader"
import { getCurrentUser } from "@/lib/storage"
import { generateThermalReceipt } from "@/lib/thermal-receipt"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/**
 * Card Reader Integration Component
 * Automatically prints receipts when a card is swiped
 * Card readers typically act as keyboard input devices
 */
export function CardReaderIntegration() {
  const user = getCurrentUser()
  const [showAdminReceiptDialog, setShowAdminReceiptDialog] = useState(false)
  const [pendingTickets, setPendingTickets] = useState<any[]>([])
  const [pendingCompanyInfo, setPendingCompanyInfo] = useState<any>(undefined)
  
  // Function to get tickets based on card data
  // Card data could be client ID, repair number, or customer name
  const getTicketsForCard = async (cardData: string): Promise<any[]> => {
    if (!user?.id) {
      console.error("[CardReader] No user ID found")
      return []
    }

    try {
      // Fetch all tickets for the current user
      const response = await fetch(`/api/repairs?userId=${user.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch tickets")
      }
      
      const data = await response.json()
      const allTickets = data.tickets || []
      
      // Try to match card data with:
      // 1. Client ID (if card contains client ID format)
      // 2. Repair Number
      // 3. Customer name (if card contains name)
      // 4. Contact number
      
      const normalizedCardData = cardData.trim().toUpperCase()
      
      // Normalize client ID for comparison
      const normalizeClientId = (id: string): string => {
        const match = id.match(/CLI-?(\d+)/i) || id.match(/(\d+)/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (!isNaN(num) && num >= 1) {
            return `CLI-${String(num).padStart(4, "0")}`
          }
        }
        return id.toUpperCase()
      }
      
      // Try to find tickets matching the card data
      const matchingTickets = allTickets.filter((ticket: any) => {
        // Match by client ID
        if (ticket.clientId) {
          const normalizedTicketClientId = normalizeClientId(ticket.clientId)
          const normalizedCardClientId = normalizeClientId(normalizedCardData)
          if (normalizedTicketClientId === normalizedCardClientId) {
            return true
          }
        }
        
        // Match by repair number
        if (ticket.repairNumber && ticket.repairNumber.toUpperCase().includes(normalizedCardData)) {
          return true
        }
        
        // Match by customer name (if card contains name)
        if (ticket.customerName && ticket.customerName.toUpperCase().includes(normalizedCardData)) {
          return true
        }
        
        // Match by contact number
        if (ticket.contact && ticket.contact.includes(cardData.trim())) {
          return true
        }
        
        return false
      })
      
      if (matchingTickets.length === 0) {
        console.log("[CardReader] No tickets found for card data:", cardData)
        return []
      }
      
      // Normalize tickets for printing
      const normalizedTickets = matchingTickets.map((ticket: any) => ({
        ...ticket,
        clientId: ticket.clientId || null,
        customerName: ticket.customerName || "N/A",
        contact: ticket.contact || "N/A",
        receivedBy: ticket.receivedBy || "N/A",
        imeiNo: ticket.imeiNo || "000000000000000",
        brand: ticket.brand || "N/A",
        model: ticket.model || "N/A",
        serialNo: ticket.serialNo || null,
        warranty: ticket.warranty || "Without Warranty",
        battery: ticket.battery ?? false,
        charger: ticket.charger ?? false,
        simCard: ticket.simCard ?? false,
        memoryCard: ticket.memoryCard ?? false,
        equipmentObs: ticket.equipmentObs || null,
        repairObs: ticket.repairObs || null,
        selectedServices: Array.isArray(ticket.selectedServices) 
          ? ticket.selectedServices 
          : (ticket.serviceName ? [ticket.serviceName] : []),
        condition: ticket.condition || null,
        problem: ticket.problem || "N/A",
        price: ticket.price || 0,
        budget: ticket.budget || null,
        repairNumber: ticket.repairNumber || "N/A",
        createdAt: ticket.createdAt || new Date().toISOString(),
      }))
      
      return normalizedTickets
    } catch (error) {
      console.error("[CardReader] Error fetching tickets:", error)
      return []
    }
  }

  // Print Admin receipt
  const handlePrintAdminReceipt = async () => {
    if (pendingTickets.length === 0) {
      setShowAdminReceiptDialog(false)
      return
    }

    try {
      // Generate Admin receipt only
      const adminReceiptText = generateThermalReceipt(pendingTickets, pendingCompanyInfo, 'ADMIN')

      // Send to printer via API
      const printResponse = await fetch("/api/print-receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receipt: adminReceiptText }),
      })

      const printResult = await printResponse.json()

      if (printResult.success) {
        toast.success(`Admin receipt printed for ${pendingTickets.length} device(s)`)
      } else {
        console.error("[CardReader] Admin print error:", printResult.error)
        toast.error(`Admin print failed: ${printResult.error || "Unknown error"}`)
      }
    } catch (error: any) {
      console.error("[CardReader] Error printing admin receipt:", error)
      toast.error(`Failed to print admin receipt: ${error.message || "Unknown error"}`)
    } finally {
      setShowAdminReceiptDialog(false)
      setPendingTickets([])
      setPendingCompanyInfo(undefined)
    }
  }

  // Handle card swipe
  const handleCardSwipe = async (cardData: string) => {
    console.log("[CardReader] Card swiped, fetching tickets...")
    const tickets = await getTicketsForCard(cardData)
    
    if (tickets.length > 0) {
      try {
        // Fetch company information
        let companyInfo = undefined
        if (user?.id) {
          try {
            const userResponse = await fetch(`/api/users?id=${user.id}`)
            if (userResponse.ok) {
              const userData = await userResponse.json()
              if (userData.user) {
                companyInfo = {
                  shopName: userData.user.shopName || userData.user.name || "",
                  address: userData.user.address || "",
                  companyEmail: userData.user.companyEmail || "",
                  website: userData.user.website || "",
                  contactNumber: userData.user.contactNumber || "",
                }
              }
            }
          } catch (error) {
            console.error("[CardReader] Error fetching company info:", error)
          }
        }

        // Generate and print Client receipt first
        const clientReceiptText = generateThermalReceipt(tickets, companyInfo, 'CLIENT')

        // Send Client receipt to printer via API
        const printResponse = await fetch("/api/print-receipt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ receipt: clientReceiptText }),
        })

        const printResult = await printResponse.json()

        if (printResult.success) {
          toast.success(`Client receipt printed for ${tickets.length} device(s)`)
          
          // Store tickets and company info for potential Admin receipt printing
          setPendingTickets(tickets)
          setPendingCompanyInfo(companyInfo)
          
          // Show dialog asking if user wants Admin receipt
          setShowAdminReceiptDialog(true)
        } else {
          console.error("[CardReader] Print error:", printResult.error)
          toast.error(`Print failed: ${printResult.error || "Unknown error"}`)
        }
      } catch (error: any) {
        console.error("[CardReader] Error printing receipt:", error)
        toast.error(`Failed to print receipt: ${error.message || "Unknown error"}`)
      }
    } else {
      toast.info("No tickets found for this card")
    }
  }

  // Enable card reader
  const { isListening } = useCardReader({
    onCardSwipe: handleCardSwipe,
    enabled: true,
    autoPrint: true,
    getTicketsForCard,
  })

  return (
    <>
      {/* Admin Receipt Confirmation Dialog */}
      <AlertDialog open={showAdminReceiptDialog} onOpenChange={setShowAdminReceiptDialog}>
        <AlertDialogContent className="bg-white border-blue-200 text-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-black">Admin Receipt</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              Do you need admin receipt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setShowAdminReceiptDialog(false)
                setPendingTickets([])
                setPendingCompanyInfo(undefined)
              }}
              className="bg-white border-blue-300 text-black hover:bg-blue-50"
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePrintAdminReceipt}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Yes, Print Admin Receipt
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

