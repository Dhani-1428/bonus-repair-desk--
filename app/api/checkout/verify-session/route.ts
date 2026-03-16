import { NextRequest, NextResponse } from "next/server"

// Stripe has been removed - MBWay is now the only payment method
// This endpoint is kept for backward compatibility but returns an error
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: "Stripe payment is no longer available. Please use MBWay payment method." },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  )
}
