import { NextRequest, NextResponse } from "next/server"

/**
 * ESC/POS Thermal Printer API Route
 * Handles printing to USB/Bluetooth thermal printers
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receipt } = body

    if (!receipt || typeof receipt !== "string") {
      return NextResponse.json(
        { error: "Receipt text is required" },
        { status: 400 }
      )
    }

    // Try to use escpos library for direct printing
    // Note: This requires the printer to be connected and accessible
    try {
      // Dynamic import to avoid build-time errors if package is not installed
      const escpos = await import("escpos")
      const escposUSB = await import("escpos-usb")

      // Get USB device (automatically finds connected USB printer)
      const device = new escposUSB.USB()
      
      // Open printer connection
      await new Promise<void>((resolve, reject) => {
        device.open((error: any) => {
          if (error) {
            console.error("[PrintReceipt] USB printer open error:", error)
            reject(error)
          } else {
            resolve()
          }
        })
      })

      // Create printer instance with encoding
      const printer = new escpos.Printer(device, {
        encoding: "CP437", // Character encoding
        width: 48, // 80mm printer width (58mm = 42)
      })

      // Check if receipt contains both Client and Admin copies
      if (receipt.includes("---PAPER_CUT_HERE---")) {
        // Split into Client and Admin copies
        const [clientReceipt, adminReceipt] = receipt.split("---PAPER_CUT_HERE---")
        
        // Print Client Copy
        printer
          .font("a")
          .align("ct")
          .style("bu")
          .size(1, 1)
          .text(clientReceipt.trim())
          .feed(3) // Feed 3 lines for spacing
          .cut() // Cut paper after Client copy
        
        // Small delay to ensure first cut completes
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Print Admin Copy
        printer
          .font("a")
          .align("ct")
          .style("bu")
          .size(1, 1)
          .text(adminReceipt.trim())
          .feed(3) // Feed 3 lines for spacing
          .cut() // Final cut after Admin copy
      } else {
        // Single receipt (Client or Admin only)
        printer
          .font("a")
          .align("ct")
          .style("bu")
          .size(1, 1)
          .text(receipt)
          .feed(3) // Feed 3 lines for spacing
          .cut()
      }
      
      // Close printer connection
      await new Promise<void>((resolve, reject) => {
        device.close((error: any) => {
          if (error) {
            console.error("[PrintReceipt] USB printer close error:", error)
            reject(error)
          } else {
            resolve()
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: "Receipt printed successfully",
      })
    } catch (escposError: any) {
      console.error("[PrintReceipt] ESC/POS error:", escposError)

      // Fallback: Return error with receipt for manual printing or debugging
      // In production, you might want to queue the print job or use a print service
      return NextResponse.json(
        {
          success: false,
          error: "Printer not available or ESC/POS library error",
          details: escposError.message,
          // Receipt is returned for debugging - remove in production if sensitive
          receipt: process.env.NODE_ENV === "development" ? receipt : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("[PrintReceipt] API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process print request",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Alternative implementation using node-thermal-printer (if escpos doesn't work)
// Uncomment and modify if needed:
/*
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { receipt } = body

    if (!receipt || typeof receipt !== "string") {
      return NextResponse.json(
        { error: "Receipt text is required" },
        { status: 400 }
      )
    }

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: 'tcp://192.168.1.100', // or 'usb://...' for USB
      characterSet: CharacterSet.PC852_LATIN2,
      removeSpecialCharacters: false,
      breakLine: BreakLine.WORD,
    })

    await printer.isPrinterConnected()
    
    printer.alignCenter()
    printer.setText(receipt)
    printer.cut()
    
    await printer.execute()

    return NextResponse.json({
      success: true,
      message: "Receipt printed successfully",
    })
  } catch (error: any) {
    console.error("[PrintReceipt] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to print receipt",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
*/

