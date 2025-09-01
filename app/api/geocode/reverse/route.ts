// app/api/geocode/reverse/route.ts
import { reverseGeocode } from "@/lib/geocode"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))
  if (Number.isNaN(lat) || Number.isNaN(lng)) return new Response("Invalid coords", { status: 400 })
  const address = await reverseGeocode(lat, lng)
  return Response.json({ address })
}
