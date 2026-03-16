import { NextRequest, NextResponse } from "next/server"

// Stripe has been removed - MBWay is now the only payment method
// This webhook endpoint is disabled
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Stripe payment is no longer available. Please use MBWay payment method." },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  )
}
