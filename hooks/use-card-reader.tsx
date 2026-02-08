"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

interface UseCardReaderOptions {
  onCardSwipe?: (cardData: string) => void
  enabled?: boolean
  autoPrint?: boolean
  getTicketsForCard?: (cardData: string) => Promise<any[]>
}

/**
 * Hook to detect card swipes from card reader devices
 * Card readers typically act as keyboard input devices
 */
export function useCardReader(options: UseCardReaderOptions = {}) {
  const { onCardSwipe, enabled = true, autoPrint = false, getTicketsForCard } = options
  const [isListening, setIsListening] = useState(false)
  const cardDataRef = useRef<string>("")
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastKeyTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) {
      setIsListening(false)
      return
    }

    setIsListening(true)

    const handleKeyPress = (e: KeyboardEvent) => {
      // Card readers typically send characters very quickly
      // We detect rapid character input (within 100ms of each other)
      const now = Date.now()
      const timeSinceLastKey = now - lastKeyTimeRef.current

      // If keys are coming in rapidly (card swipe), collect them
      if (timeSinceLastKey < 100) {
        cardDataRef.current += e.key
      } else {
        // Reset if too much time has passed (not a card swipe)
        cardDataRef.current = e.key
      }

      lastKeyTimeRef.current = now

      // Clear existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // Wait for card swipe to complete (no input for 200ms)
      timerRef.current = setTimeout(() => {
        const cardData = cardDataRef.current.trim()
        
        // Card data is typically 16-19 characters (credit card format)
        // or could be a custom format (CLI-0001, repair numbers, etc.)
        // Only process if it looks like card data (numeric, CLI format, or long enough)
        const isCardFormat = cardData.length >= 10 && (
          /^\d+$/.test(cardData) || // All digits (credit card, repair number)
          /^CLI-?\d+$/i.test(cardData) || // Client ID format
          cardData.length >= 15 // Long alphanumeric (likely card data)
        )
        
        if (isCardFormat) {
          console.log("[CardReader] Card swiped:", cardData)
          
          if (onCardSwipe) {
            onCardSwipe(cardData)
          }

          if (autoPrint && getTicketsForCard) {
            getTicketsForCard(cardData)
              .then((tickets) => {
                if (tickets && tickets.length > 0) {
                  // Import and call print function
                  import("@/components/new-repair-ticket-form").then((module) => {
                    module.printReceiptWithLanguageSelection(tickets)
                  })
                  toast.success(`Printing receipt for ${tickets.length} device(s)`)
                } else {
                  // Only show error if it's a valid card format (not random typing)
                  // Suppress error for very short inputs or non-card formats
                  if (cardData.length >= 15 || /^CLI-?\d+$/i.test(cardData)) {
                    console.log("[CardReader] No tickets found for card:", cardData)
                    // Don't show toast for card reader - it's too noisy
                    // toast.info("No tickets found for this card")
                  }
                }
              })
              .catch((error) => {
                console.error("[CardReader] Error getting tickets:", error)
                // Only show error for valid card formats
                if (cardData.length >= 15 || /^CLI-?\d+$/i.test(cardData)) {
                  toast.error("Error retrieving ticket information")
                }
              })
          }

          // Reset card data
          cardDataRef.current = ""
        } else {
          // Not a card swipe, just reset silently
          cardDataRef.current = ""
        }
      }, 200)
    }

    // Listen for keypress events
    window.addEventListener("keydown", handleKeyPress)

    return () => {
      window.removeEventListener("keydown", handleKeyPress)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [enabled, onCardSwipe, autoPrint, getTicketsForCard])

  return {
    isListening,
    enable: () => setIsListening(true),
    disable: () => setIsListening(false),
  }
}

