"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher, useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [signInError, setSignInError] = useState<string | null>(null)
  const [initialForm, setInitialForm] = useState({
    foodName: "",
    description: "",
    photoUrl: "",
    expiryAt: "",
    location: { text: "", lat: undefined as number | undefined, lng: undefined as number | undefined } as Location,
  })
  
  const [uploaderKey, setUploaderKey] = useState(Date.now());
  
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
        const initialData = {
          foodName: p.foodName,
          description: p.description,
          photoUrl: p.photoUrl,
          expiryAt: new Date(p.expiryAt).toISOString().slice(0, 16),
          location: { text: p.locationText, lat: p.lat, lng: p.lng },
        }
        setForm(initialData)
        setInitialForm(initialData)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [editId]) // Removed fetcher from dependencies to prevent infinite loops

  // Reset form when switching from edit to add mode
  useEffect(() => {
    if (!editId) {
      setForm({
        foodName: "",
        description: "",
        photoUrl: "",
        expiryAt: "",
        location: { text: "", lat: undefined, lng: undefined },
      });
      setTouched({});
      setErrors({});
      setUploaderKey(Date.now()); // Force remount of ImageUploader
    }
  }, [editId]);

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
      <main className="mx-auto max-w-4xl px-4 py-6 text-center">
        <h1 className="text-2xl font-bold">Sign In Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in with your Google account to add a food donation.</p>
        <Button onClick={handleSignIn} className="mt-4" disabled={authLoading}>
          {authLoading ? 'Signing in...' : 'Sign in with Google'}
        </Button>
        {signInError && (
          <p className="mt-3 text-sm text-destructive">{signInError}</p>
        )}
      </main>
    )
  }
  
  // Check if form has any changes
  const hasChanges = () => {
    return (
      form.foodName !== initialForm.foodName ||
      form.description !== initialForm.description ||
      form.photoUrl !== initialForm.photoUrl ||
      form.expiryAt !== initialForm.expiryAt ||
      form.location.text !== initialForm.location.text ||
      form.location.lat !== initialForm.location.lat ||
      form.location.lng !== initialForm.location.lng
    )
  }

  // Disable form fields when uploading image or detecting location
  const areFieldsDisabled = isUploading || isDetectingLocation
  
  // Disable submit button when form is being processed or no changes in edit mode
  const isSubmitDisabled = areFieldsDisabled || (!!editId && !hasChanges())

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
    setIsSubmitting(true)
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
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {editId ? "Edit Donation" : "Share Your Surplus Food"}
        </h1>
        <p className="text-muted-foreground">
          {editId ? "Update your food donation details" : "Fill out the details below to create your donation listing."}
        </p>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{editId ? "Edit Donation" : "Donation Details"}</CardTitle>
          <CardDescription>
            {editId ? "Update the details of your food donation" : "Provide information about the food you're sharing"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="foodName">
            Food Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="foodName"
            type="text"
            value={form.foodName}
            onChange={(e) => !areFieldsDisabled && setForm({ ...form, foodName: e.target.value })}
            onBlur={() => !areFieldsDisabled && handleBlur('foodName')}
            placeholder="e.g., Freshly made pasta"
            disabled={areFieldsDisabled}
            className={touched.foodName && errors.foodName ? 'border-destructive' : ''}
          />
          {touched.foodName && errors.foodName && (
            <p className="text-sm text-destructive">{errors.foodName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => !areFieldsDisabled && setForm({ ...form, description: e.target.value })}
            onBlur={() => !areFieldsDisabled && handleBlur('description')}
            placeholder="Provide details about the food (ingredients, quantity, packaging, etc.)"
            disabled={areFieldsDisabled}
            className={touched.description && errors.description ? 'border-destructive' : ''}
          />
          {touched.description && errors.description && (
            <p className="text-sm text-destructive">{errors.description}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            Photo <span className="text-destructive">*</span>
          </Label>
          <div className="space-y-2">
            <ImageUploader 
              key={uploaderKey}
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
              disabled={areFieldsDisabled}
            />
            {touched.photoUrl && errors.photoUrl && (
              <p className="text-sm text-destructive">{errors.photoUrl}</p>
            )}
            {!form.photoUrl && !isUploading && (
              <p className="text-sm text-muted-foreground">
                Upload a clear photo of the food (max 5MB, JPG/PNG)
              </p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryAt">
            Expiry Date & Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id="expiryAt"
            type="datetime-local"
            className={`max-w-xs ${touched.expiryAt && errors.expiryAt ? 'border-destructive' : ''}`}
            value={form.expiryAt}
            onChange={(e) => !areFieldsDisabled && setForm({ ...form, expiryAt: e.target.value })}
            onBlur={() => !areFieldsDisabled && handleBlur('expiryAt')}
            disabled={areFieldsDisabled}
          />
          {touched.expiryAt && errors.expiryAt && (
            <p className="text-sm text-destructive">{errors.expiryAt}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            Pickup Location <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <LocationInput 
              value={form.location} 
              onChange={(v: Location) => {
                if (areFieldsDisabled) return;
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
                if (areFieldsDisabled) return;
                setIsDetectingLocation(true);
              }}
              onDetectEnd={() => {
                setIsDetectingLocation(false);
              }}
              className={`w-full ${touched.location && errors.location ? 'border-destructive' : ''} ${
                areFieldsDisabled ? 'opacity-75' : ''
              }`}
              onBlur={() => !areFieldsDisabled && handleBlur('location')}
              placeholder={isDetectingLocation ? 'Detecting location...' : 'Enter address or click to select on map'}
              disabled={areFieldsDisabled}
            />
            {isDetectingLocation && (
              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80">
                <div className="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm border">
                  Detecting location...
                </div>
              </div>
            )}
          </div>
          {touched.location && errors.location ? (
            <p className="text-sm text-destructive">{errors.location}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Where can the food be picked up from?
            </p>
          )}
        </div>
        </CardContent>
        
        <CardFooter className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end sm:gap-4 border-t px-6 py-4">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
            disabled={areFieldsDisabled}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto relative min-w-[150px]"
            onClick={submit}
            disabled={loading || isSubmitting || isSubmitDisabled}
          >
            {(isUploading || isDetectingLocation) && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/90 rounded-md">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            )}
            <span className={isUploading || isDetectingLocation ? 'invisible' : ''}>
              {isSubmitting ? (editId ? 'Saving...' : 'Submitting...') : (editId ? 'Update Donation' : 'Submit Donation')}
            </span>
          </Button>
        </CardFooter>
      </Card>
      
      <p className="mt-6 text-center text-sm text-muted-foreground">
        By submitting, you agree to our{' '}
        <a href="/terms" className="font-medium text-primary hover:underline">Terms of Service</a> and{' '}
        <a href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</a>.
      </p>
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
