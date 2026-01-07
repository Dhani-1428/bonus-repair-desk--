/**
 * Thermal Receipt Generator for ESC/POS Printers
 * Formats receipt data for 58mm/80mm thermal printers
 */

export interface ThermalTicket {
  repairNumber?: string
  customerName?: string
  contact?: string
  brand?: string
  model?: string
  imeiNo?: string
  problem?: string
  price?: number
  createdAt?: string
  clientId?: string
  receivedBy?: string
  services?: string | string[]
  equipmentObs?: string
  warranty?: string
}

export interface CompanyInfo {
  shopName?: string
  address?: string
  companyEmail?: string
  website?: string
  contactNumber?: string
}

/**
 * Generate thermal receipt text for ESC/POS printer
 * @param tickets Array of ticket objects
 * @param companyInfo Company information to display on receipt
 * @returns Formatted receipt string ready for ESC/POS printing
 */
export function generateThermalReceipt(
  tickets: ThermalTicket[],
  companyInfo?: CompanyInfo
): string {
  if (!tickets || tickets.length === 0) {
    return ""
  }

  const shopName = companyInfo?.shopName || "Repair Shop"
  const address = companyInfo?.address || ""
  const email = companyInfo?.companyEmail || ""
  const website = companyInfo?.website || ""
  const phone = companyInfo?.contactNumber || ""

  // Use first ticket for client info
  const firstTicket = tickets[0]
  const clientName = firstTicket.customerName || "N/A"
  const clientId = firstTicket.clientId || "N/A"
  const contact = firstTicket.contact || "N/A"
  const receivedBy = firstTicket.receivedBy || "N/A"

  // Format date
  const entryDate = firstTicket.createdAt
    ? new Date(firstTicket.createdAt)
    : new Date()
  const formattedDate = entryDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const formattedTime = entryDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })

  let receipt = ""

  // Header
  receipt += "=".repeat(32) + "\n"
  receipt += "CLIENT COPY\n"
  receipt += "=".repeat(32) + "\n\n"

  // Company Information
  receipt += centerText(shopName, 32) + "\n"
  if (address) receipt += address + "\n"
  if (email) receipt += email + "\n"
  if (website) receipt += website + "\n"
  if (phone) receipt += phone + "\n"
  receipt += "\n"

  receipt += "-".repeat(32) + "\n"

  // Client Information
  receipt += `Client ID: ${clientId}\n`
  receipt += `Name: ${clientName}\n`
  receipt += `Phone: ${contact}\n`
  receipt += `Received By: ${receivedBy}\n`
  receipt += `Date: ${formattedDate} ${formattedTime}\n`
  receipt += "\n"

  receipt += "-".repeat(32) + "\n"

  // Device Information
  if (tickets.length === 1) {
    // Single device receipt
    const ticket = tickets[0]
    receipt += `Repair #: ${ticket.repairNumber || "N/A"}\n`
    receipt += `IMEI: ${ticket.imeiNo || "N/A"}\n`
    receipt += `Device: ${ticket.brand || "N/A"} ${ticket.model || "N/A"}\n`
    if (ticket.warranty) {
      receipt += `Warranty: ${ticket.warranty}\n`
    }

    receipt += "\n"

    // Services
    if (ticket.services) {
      const services = Array.isArray(ticket.services)
        ? ticket.services.join(", ")
        : ticket.services
      receipt += `Services: ${services}\n`
    }

    // Problem
    if (ticket.problem && ticket.problem !== "N/A") {
      receipt += `Problem: ${ticket.problem}\n`
    }

    // Equipment Observations
    if (ticket.equipmentObs) {
      receipt += `Conditions: ${ticket.equipmentObs}\n`
    }

    receipt += "\n"
    receipt += `Price: €${Number.parseFloat(ticket.price?.toString() || "0").toFixed(2)}\n`
  } else {
    // Multiple devices receipt
    receipt += `Number of Devices: ${tickets.length}\n`
    receipt += `Entry Date: ${formattedDate} ${formattedTime}\n\n`

    tickets.forEach((ticket, index) => {
      receipt += `Device ${index + 1}:\n`
      receipt += `  Repair #: ${ticket.repairNumber || "N/A"}\n`
      receipt += `  IMEI: ${ticket.imeiNo || "N/A"}\n`
      receipt += `  Device: ${ticket.brand || "N/A"} ${ticket.model || "N/A"}\n`
      if (ticket.warranty) {
        receipt += `  Warranty: ${ticket.warranty}\n`
      }
      if (ticket.services) {
        const services = Array.isArray(ticket.services)
          ? ticket.services.join(", ")
          : ticket.services
        receipt += `  Services: ${services}\n`
      }
      receipt += `  Price: €${Number.parseFloat(ticket.price?.toString() || "0").toFixed(2)}\n`
      receipt += "\n"
    })

    // Total Price
    const totalPrice = tickets.reduce(
      (sum, ticket) => sum + Number.parseFloat(ticket.price?.toString() || "0"),
      0
    )
    receipt += `Total Price: €${totalPrice.toFixed(2)}\n`
  }

  receipt += "\n"
  receipt += "-".repeat(32) + "\n"

  // Footer
  receipt += "Thank you for your business!\n"
  receipt += "Keep this receipt for reference.\n"
  receipt += "\n"

  // Repair Reference
  if (tickets.length === 1) {
    receipt += `Repair Reference: ${tickets[0].repairNumber || "N/A"}\n`
  }

  receipt += "\n"
  receipt += "=".repeat(32) + "\n"

  return receipt
}

/**
 * Center text within a given width
 */
function centerText(text: string, width: number): string {
  const padding = Math.max(0, Math.floor((width - text.length) / 2))
  return " ".repeat(padding) + text
}

