"use client"

import { Navbar } from "@/components/navbar"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { PageLoader } from "@/components/ui/page-loader"
import { useProfile } from "@/contexts/profile-context"

export default function ProfilePage() {
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
  }, [profile, user?.displayName, form.email])

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
        <p className="text-muted-foreground mb-6">Manage your account information and settings</p>
        
        {showLoading || !profile?.email ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.photoURL || ''} />
                <AvatarFallback className="text-xl">
                  {form.name ? form.name[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">{form.email}</p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const value = e.target.value
                    const digitsOnly = value.replace(/\D/g, '')
                    
                    if (digitsOnly.length <= 10) {
                      setForm({ ...form, phone: digitsOnly })
                      if (error) setError("")
                    }
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="Enter 10-digit phone number"
                  className={error ? 'border-destructive' : ''}
                />
                {error && <p className="text-sm text-destructive mt-1">{error}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Enter your full address"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your primary address (optional)
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end border-t pt-4">
              <Button 
                onClick={save} 
                disabled={saving || !hasChanges()}
                className="min-w-32"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save changes'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  )
}
