"use client"

import { useEffect, useRef } from "react"
import { useCardReader } from "@/hooks/use-card-reader"
import { getCurrentUser } from "@/lib/storage"
import { printReceiptWithLanguageSelection } from "@/components/new-repair-ticket-form"
import { toast } from "sonner"

/**
 * Card Reader Integration Component
 * Automatically prints receipts when a card is swiped
 * Card readers typically act as keyboard input devices
 */
export function CardReaderIntegration() {
  const user = getCurrentUser()
  
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

  // Handle card swipe
  const handleCardSwipe = async (cardData: string) => {
    console.log("[CardReader] Card swiped, fetching tickets...")
    const tickets = await getTicketsForCard(cardData)
    
    if (tickets.length > 0) {
      // Print receipt for client (thermal format)
      await printReceiptWithLanguageSelection(tickets, null, "en", "thermal")
      toast.success(`Receipt printed for ${tickets.length} device(s)`)
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

  return null // This component doesn't render anything visible
}

