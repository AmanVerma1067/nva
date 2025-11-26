import { NextResponse } from "next/server"

export async function GET() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    
    if (!backendUrl) {
      return NextResponse.json({
        status: "error",
        message: "Backend URL not configured",
      }, { status: 500 })
    }

    const response = await fetch(`${backendUrl}/health`)
    const data = await response.json()

    return NextResponse.json({
      status: "ok",
      backend: data,
      configured: true,
    })
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error instanceof Error ? error.message : "Backend unreachable",
      configured: false,
    }, { status: 500 })
  }
}