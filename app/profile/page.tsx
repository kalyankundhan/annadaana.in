"use client"

import { Navbar } from "@/components/navbar"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useProfile } from "@/contexts/profile-context"

function ProfileContent() {
  const { user, loading: authLoading, getIdToken } = useAuth()
  const { profile, isLoading, error: fetchError, mutate } = useProfile()
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  // Show loading state if either auth is loading or profile is loading
  const showLoading = authLoading || isLoading
  
  useEffect(() => {
    if (profile && form.email === "") {
      setForm({
        name: profile.name || user?.displayName || "",
        email: profile.email,
        phone: profile.phone || "",
        address: profile.address || ""
      })
    }
  }, [profile, user?.displayName])

  const validatePhoneNumber = (value: string) => {
    // Allow only digits and remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, '')
    return /^\d{0,10}$/.test(digitsOnly) // Allow up to 10 digits
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    return value.replace(/\D/g, '')
  }

  // Check if form has changes compared to profile
  const hasChanges = () => {
    if (!profile) return false;
    return (
      form.name !== (profile.name || user?.displayName || '') ||
      form.phone !== (profile.phone || '') ||
      form.address !== (profile.address || '')
    );
  };

  const save = async () => {
    const phoneValue = form.phone.trim()
    const digitsOnly = formatPhoneNumber(phoneValue)
    
    if (!phoneValue) {
      setError("Phone number is required")
      return
    }
    
    if (digitsOnly.length !== 10) {
      setError("Phone number must be exactly 10 digits")
      return
    }
    
    if (!hasChanges()) {
      return;
    }
    
    setError("")
    setSaving(true)
    try {
      const token = await getIdToken()
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          name: form.name, 
          phone: phoneValue, 
          address: form.address 
        }),
      })
      
      if (!response.ok) {
        throw new Error(await response.text())
      }
      
      await mutate()
    } catch (e: any) {
      setError(e.message || "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      {showLoading || !profile?.email ? (
        <div className="mt-8 flex flex-col items-center justify-center space-y-6 py-8">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-t-primary/50 border-r-primary/50 border-b-transparent border-l-transparent animate-spin animation-delay-200"></div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">Loading your profile</p>
            <p className="text-sm text-muted-foreground">Just a moment while we fetch your details...</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1">
            <span className="text-sm">Name</span>
            <input
              className="rounded-md border px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Gmail</span>
            <input className="rounded-md border bg-muted px-3 py-2 text-sm" value={form.email} disabled />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Phone Number</span>
            <input
              className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-500' : ''}`}
              value={form.phone}
              onChange={(e) => {
                const value = e.target.value
                const digitsOnly = value.replace(/\D/g, '')
                
                // Only update if the input is valid (up to 10 digits)
                if (digitsOnly.length <= 10) {
                  setForm({ ...form, phone: digitsOnly })
                  if (error) setError("")
                }
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              placeholder="Enter phone number"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Address</span>
            <input
              className="rounded-md border px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <Button 
              onClick={save} 
              disabled={saving || !hasChanges()}
              className={`${!hasChanges() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? "Saving updates..." : "Save changes"}
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <ProfileContent />
    </>
  )
}
