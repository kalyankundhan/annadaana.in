"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher, useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { ImageUploader } from "@/components/image-uploader"
import { LocationInput } from "@/components/location-input"
import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

type Location = {
  text: string
  lat: number | undefined
  lng: number | undefined
}

function AddContent() {
  // All hooks must be called at the top level, before any conditional returns
  const { user, loading: authLoading, signInGoogle } = useAuth()
  const fetcher = useAuthedFetcher()
  const search = useSearchParams()
  const editId = search.get("id")
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [signInError, setSignInError] = useState<string | null>(null)
  const [form, setForm] = useState({
    foodName: "",
    description: "",
    photoUrl: "",
    expiryAt: "",
    location: { text: "", lat: undefined as number | undefined, lng: undefined as number | undefined } as Location,
  })
  
  // Move all effects to the top level
  useEffect(() => {
    if (!authLoading && !user) {
      // Store the current URL to redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + (editId ? `?id=${editId}` : ''))
    }
  }, [user, authLoading, editId])
  
  // Load post data if in edit mode
  useEffect(() => {
    const load = async () => {
      if (!editId) return
      setLoading(true)
      try {
        const res = await fetcher(`/api/posts/${editId}`)
        const p = res.data
        setForm({
          foodName: p.foodName,
          description: p.description,
          photoUrl: p.photoUrl,
          expiryAt: new Date(p.expiryAt).toISOString().slice(0, 16),
          location: { text: p.locationText, lat: p.lat, lng: p.lng },
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [editId, fetcher])

  const handleSignIn = async () => {
    try {
      setSignInError(null)
      const { error } = await signInGoogle()
      if (error) {
        setSignInError(error)
      }
    } catch (err) {
      setSignInError('Failed to sign in. Please try again.')
    }
  }

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Show sign in prompt if not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">Sign In Required</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="mb-6">Please sign in with your Google account to add a food donation.</p>
          <Button 
            onClick={handleSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={authLoading}
          >
            {authLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>
          {signInError && (
            <p className="mt-3 text-red-500 text-sm">{signInError}</p>
          )}
        </div>
      </div>
    )
  }
  
  // Disable form when uploading image or detecting location
  const isFormDisabled = isUploading || isDetectingLocation

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!form.foodName) newErrors.foodName = 'Food name is required'
    if (!form.description) newErrors.description = 'Description is required'
    if (!form.photoUrl) newErrors.photoUrl = 'Photo is required'
    if (!form.expiryAt) newErrors.expiryAt = 'Expiry date is required'
    if (!form.location.text || form.location.lat == null || form.location.lng == null) {
      newErrors.location = 'Location is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  const submit = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    // Mark all fields as touched when submitting
    const allFields = {
      foodName: true,
      description: true,
      photoUrl: true,
      expiryAt: true,
      location: true
    }
    setTouched(allFields)
    
    if (!validateForm()) {
      return
    }
    setLoading(true)
    try {
      if (editId) {
        await fetcher(`/api/posts/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodName: form.foodName,
            description: form.description,
            photoUrl: form.photoUrl,
            expiryAt: form.expiryAt,
            locationText: form.location.text,
            lat: form.location.lat,
            lng: form.location.lng,
          }),
        })
      } else {
        await fetcher("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodName: form.foodName,
            description: form.description,
            photoUrl: form.photoUrl,
            expiryAt: form.expiryAt,
            locationText: form.location.text,
            lat: form.location.lat,
            lng: form.location.lng,
          }),
        })
      }
      router.push("/my-donations")
    } catch (e: any) {
      alert(e.message || "Failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {editId ? "Edit Donation" : "Add Food Donation"}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {editId ? "Update your food donation details" : "Share your excess food with those in need"}
        </p>
      </div>
      
      <div className="space-y-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:rounded-2xl sm:p-8">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Food Name <span className="text-destructive">*</span>
          </label>
          <div className="mt-1">
            <input
              type="text"
              className={`block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                touched.foodName && errors.foodName ? 'border-red-500' : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} px-4 py-2.5`}
              value={form.foodName}
              onChange={(e) => !isFormDisabled && setForm({ ...form, foodName: e.target.value })}
              onBlur={() => !isFormDisabled && handleBlur('foodName')}
              placeholder="e.g., Freshly made pasta"
              disabled={isFormDisabled}
            />
          </div>
          {touched.foodName && errors.foodName && (
            <p className="mt-1 text-sm text-destructive">{errors.foodName}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description <span className="text-destructive">*</span>
          </label>
          <div className="mt-1">
            <textarea
              rows={4}
              className={`block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                touched.description && errors.description ? 'border-red-500' : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} px-4 py-2.5`}
              value={form.description}
              onChange={(e) => !isFormDisabled && setForm({ ...form, description: e.target.value })}
              onBlur={() => !isFormDisabled && handleBlur('description')}
              placeholder="Provide details about the food (ingredients, quantity, packaging, etc.)"
              disabled={isFormDisabled}
            />
          </div>
          {touched.description && errors.description && (
            <p className="mt-1 text-sm text-destructive">{errors.description}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Photo <span className="text-destructive">*</span>
          </label>
          <div className="space-y-2">
            <ImageUploader 
              onUploaded={(url) => {
                setForm(prev => ({ ...prev, photoUrl: url }))
                setErrors(prev => ({ ...prev, photoUrl: '' }))
                setIsUploading(false)
              }}
              onUploadStart={() => {
                setIsUploading(true)
                setErrors(prev => ({ ...prev, photoUrl: '' }))
              }}
              initialImageUrl={form.photoUrl}
              className={touched.photoUrl && errors.photoUrl ? '!border-destructive' : ''}
              disabled={isFormDisabled}
            />
            {touched.photoUrl && errors.photoUrl && (
              <p className="mt-1 text-sm text-destructive">{errors.photoUrl}</p>
            )}
            {!form.photoUrl && !isUploading && (
              <p className="mt-1 text-xs text-gray-500">
                Upload a clear photo of the food (max 5MB, JPG/PNG)
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Expiry Date & Time <span className="text-destructive">*</span>
          </label>
          <div className="mt-1">
            <input
              type="datetime-local"
              className={`block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                touched.expiryAt && errors.expiryAt ? 'border-red-500' : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} px-4 py-2.5`}
              value={form.expiryAt}
              onChange={(e) => !isFormDisabled && setForm({ ...form, expiryAt: e.target.value })}
              onBlur={() => !isFormDisabled && handleBlur('expiryAt')}
              disabled={isFormDisabled}
            />
          </div>
          {touched.expiryAt && errors.expiryAt && (
            <p className="mt-1 text-sm text-destructive">{errors.expiryAt}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Pickup Location <span className="text-destructive">*</span>
          </label>
          <div className="relative mt-1">
            <LocationInput 
              value={form.location} 
              onChange={(v: Location) => {
                if (isFormDisabled) return;
                setForm(prev => ({
                  ...prev,
                  location: {
                    ...prev.location,
                    text: v.text,
                    lat: v.lat,
                    lng: v.lng
                  }
                }));
                if (v.text && v.lat != null && v.lng != null) {
                  setErrors(prev => ({ ...prev, location: '' }));
                  setIsDetectingLocation(false);
                } else if (v.text) {
                  setIsDetectingLocation(true);
                }
              }}
              onDetectStart={() => {
                if (isFormDisabled) return;
                setIsDetectingLocation(true);
              }}
              onDetectEnd={() => {
                setIsDetectingLocation(false);
              }}
              className={`block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm ${
                touched.location && errors.location ? 'border-red-500' : 'border-gray-300'
              } ${isFormDisabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : 'bg-white'}`}
              onBlur={() => !isFormDisabled && handleBlur('location')}
              placeholder={isDetectingLocation ? 'Detecting location...' : 'Enter address or click to select on map'}
              disabled={isFormDisabled}
            />
            {isDetectingLocation && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                <div className="rounded-md bg-white px-3 py-1.5 text-sm font-medium shadow-sm">
                  Detecting location...
                </div>
              </div>
            )}
          </div>
          {touched.location && errors.location ? (
            <p className="mt-1 text-sm text-destructive">{errors.location}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500">
              Where can the food be picked up from?
            </p>
          )}
        </div>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:items-center sm:gap-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto h-10"
            disabled={isFormDisabled}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto h-10 relative min-w-[150px]"
            onClick={submit}
            disabled={loading || isFormDisabled}
          >
            {(isUploading || isDetectingLocation) && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/90">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            )}
            <span className={isUploading || isDetectingLocation ? 'invisible' : ''}>
              {loading ? (editId ? 'Saving...' : 'Submitting...') : (editId ? 'Update Donation' : 'Submit Donation')}
            </span>
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>By submitting, you agree to our <a href="/terms" className="font-medium text-primary hover:text-primary/90">Terms of Service</a> and <a href="/privacy" className="font-medium text-primary hover:text-primary/90">Privacy Policy</a>.</p>
      </div>
    </main>
  )
}

export default function AddPage() {
  return (
    <AuthProvider>
      <Navbar />
      <AddContent />
    </AuthProvider>
  )
}
