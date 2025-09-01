"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"

type Location = {
  text: string
  lat: number | undefined
  lng: number | undefined
}

interface LocationInputProps {
  value: Location
  onChange: (v: Location) => void
  className?: string
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  onDetectStart?: () => void
  onDetectEnd?: () => void
}

export function LocationInput({
  value,
  onChange,
  className = '',
  onBlur,
  placeholder = 'Enter address',
  disabled = false,
  onDetectStart,
  onDetectEnd
}: LocationInputProps) {
  const [loading, setLoading] = useState(false)
  const detect = async () => {
    if (disabled) return
    if (!navigator.geolocation) return alert("Geolocation not supported")
    setLoading(true)
    onDetectStart?.()
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lng=${longitude}`)
          const data = await res.json()
          onChange({ text: data.address || "", lat: latitude, lng: longitude })
        } catch {
          alert("Failed to detect address")
        } finally {
          setLoading(false)
          onDetectEnd?.()
        }
      },
      () => {
        alert("Failed to get location")
        setLoading(false)
        onDetectEnd?.()
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  return (
    <div className={`flex flex-col gap-2 ${className}`} onBlur={onBlur}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value.text}
          onChange={(e) => !disabled && onChange({ ...value, text: e.target.value })}
          placeholder={placeholder}
          className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          disabled={disabled}
        />
        <Button type="button" variant="secondary" onClick={detect} disabled={loading || disabled}>
          {loading ? "Detecting..." : "Use GPS"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {value.lat && value.lng ? `Lat: ${value.lat.toFixed(5)}, Lng: ${value.lng.toFixed(5)}` : "No coordinates yet"}
      </p>
    </div>
  )
}
