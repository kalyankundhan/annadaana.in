// lib/geocode.ts
export async function reverseGeocode(lat: number, lng: number) {
  const key = process.env.OPENCAGE_API_KEY
  if (!key) throw new Error("OPENCAGE_API_KEY not set")
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(`${lat},${lng}`)}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to reverse geocode")
  const data = await res.json()
  const formatted = data?.results?.[0]?.formatted as string | undefined
  return formatted || ""
}

export async function geocodeAddress(address: string) {
  const key = process.env.OPENCAGE_API_KEY
  if (!key) throw new Error("OPENCAGE_API_KEY not set")
  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${key}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to geocode")
  const data = await res.json()
  const comp = data?.results?.[0]
  return {
    lat: comp?.geometry?.lat as number | undefined,
    lng: comp?.geometry?.lng as number | undefined,
    formatted: comp?.formatted as string | undefined,
  }
}
