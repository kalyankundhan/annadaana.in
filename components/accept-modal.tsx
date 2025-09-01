"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useAuthedFetcher, useAuth } from "./auth-provider"

export function AcceptModal({
  requestId,
  defaultName,
  defaultPhone,
  address,
  onAccepted,
}: {
  requestId: string
  defaultName?: string | null
  defaultPhone?: string | null
  address?: string
  onAccepted?: () => void
}) {
  const fetcher = useAuthedFetcher()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(defaultName || "")
  const [phone, setPhone] = useState(defaultPhone || "")
  const [loading, setLoading] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [hasFetchedProfile, setHasFetchedProfile] = useState(false)
  const [currentAddress, setCurrentAddress] = useState(address || "")
  const [error, setError] = useState("")

  const validatePhoneNumber = (value: string) => {
    // Allow only digits and remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, '')
    return /^\d{0,10}$/.test(digitsOnly) // Allow up to 10 digits
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    return value.replace(/\D/g, '')
  }

  const validateForm = () => {
    const phoneValue = phone.trim()
    const digitsOnly = formatPhoneNumber(phoneValue)
    
    if (!phoneValue) {
      setError("Phone number is required")
      return false
    }
    
    if (digitsOnly.length !== 10) {
      setError("Phone number must be exactly 10 digits")
      return false
    }
    
    setError("")
    return true
  }

  const confirm = async () => {
    if (!validateForm()) return
    
    setLoading(true)
    try {
      await fetcher(`/api/requests/${requestId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      })
      setOpen(false)
      onAccepted?.()
    } catch (e: any) {
      setError(e.message || "Failed to accept. Please try again.")
      console.error("Accept error:", e)
    } finally {
      setLoading(false)
    }
  }

  // Update address whenever the address prop changes
  useEffect(() => {
    if (address) {
      setCurrentAddress(address)
    }
  }, [address])

  // Fetch profile data when modal opens
  useEffect(() => {
    const fetchProfile = async () => {
      if (!open || hasFetchedProfile) return
      
      setIsProfileLoading(true)
      try {
        const res = await fetcher('/api/profile')
        if (res?.data) {
          const { name: profileName, phone: profilePhone } = res.data
          if (profileName) setName(profileName)
          if (profilePhone) setPhone(profilePhone)
          // Don't update address from profile, use the one from the post
          setHasFetchedProfile(true)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
        // Silently fail - user can still enter details manually
        setHasFetchedProfile(true) // Don't retry on error
      } finally {
        setIsProfileLoading(false)
      }
    }

    if (open) {
      fetchProfile()
    }
  }, [open, fetcher, hasFetchedProfile])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen)
        if (!isOpen) {
          // Reset fetch flag when modal is closed
          setHasFetchedProfile(false)
        }
      }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          Accept
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Accept</DialogTitle>
          <DialogDescription>Confirm donor details to share with the requester</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm">Name</span>
            <input
              className="rounded-md border px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isProfileLoading}
              placeholder={isProfileLoading ? 'Loading...' : 'Enter your name'}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Phone Number</span>
            <input
              className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-500' : ''}`}
              value={phone}
              onChange={(e) => {
                const value = e.target.value
                const digitsOnly = value.replace(/\D/g, '')
                
                // Only update if the input is valid (up to 10 digits)
                if (digitsOnly.length <= 10) {
                  setPhone(digitsOnly)
                  if (error) setError("")
                }
              }}
              disabled={isProfileLoading}
              placeholder={isProfileLoading ? 'Loading...' : 'Enter phone number'}
              required
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Address</span>
            <input 
              className="rounded-md border bg-muted px-3 py-2 text-sm" 
              value={currentAddress || 'Loading address...'} 
              disabled 
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirm} disabled={loading}>
            {loading ? "Confirming..." : "Confirm Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
