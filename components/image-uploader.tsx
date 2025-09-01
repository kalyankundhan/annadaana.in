"use client"

import { useState, useRef, ChangeEvent, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuthedFetcher, useAuth } from "./auth-provider"
import { Progress } from "@/components/ui/progress"
import { X, Upload } from "lucide-react"

interface ImageUploaderProps {
  onUploaded: (url: string) => void
  onUploadStart?: () => void
  className?: string
  initialImageUrl?: string
  disabled?: boolean
}

export function ImageUploader({
  onUploaded,
  onUploadStart,
  className = '',
  initialImageUrl = '',
  disabled = false
}: ImageUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { getIdToken } = useAuth()
  const authedFetcher = useAuthedFetcher()

  // Set initial preview if editing
  useEffect(() => {
    if (initialImageUrl) {
      setPreview(initialImageUrl)
      // Notify parent about the initial image
      onUploaded(initialImageUrl)
    }
  }, [initialImageUrl])

  // Function to get the current user's ID token
  const getAuthToken = async (): Promise<string> => {
    const token = await getIdToken()
    if (!token) {
      throw new Error('Authentication required. Please sign in again.')
    }
    return token
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB')
      return
    }

    setError(null)
    setFile(selectedFile)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)

    // Auto-upload the file
    if (onUploadStart) onUploadStart()
    uploadFile(selectedFile)
  }

  const uploadFile = async (fileToUpload: File) => {
    setLoading(true)
    setError(null)
    setUploadProgress(0)
    
    const formData = new FormData()
    formData.append('file', fileToUpload)
    
    try {
      // Create a new XMLHttpRequest to track upload progress
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(progress)
        }
      }
      
      // Get the auth token first
      const token = await getAuthToken()
      
      const res = await new Promise<{ url: string }>((resolve, reject) => {
        xhr.open('POST', '/api/upload', true)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch (e) {
              reject(new Error('Invalid server response'))
            }
          } else {
            reject(new Error(xhr.statusText || 'Upload failed'))
          }
        }
        
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })
      
      onUploaded(res.url)
      return res
      
    } catch (e: any) {
      setError(e.message || 'Upload failed. Please try again.')
      setPreview(null)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      throw e
    } finally {
      setLoading(false)
      if (uploadProgress < 100) {
        setUploadProgress(100)
      }
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFile(null)
    setPreview(initialImageUrl || null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (!initialImageUrl) {
      onUploaded('')
    }
  }

  return (
    <div className={className}>
      <div className="relative h-64 w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 transition-all duration-200 hover:border-primary/50 hover:shadow-sm">
        {loading ? (
          <div className="flex h-full w-full flex-col items-center justify-center space-y-4 p-6 text-center">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-primary/10"></div>
              <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Uploading {Math.round(uploadProgress)}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : preview ? (
          <div className="group relative h-full w-full">
            <div className="flex h-full items-center justify-center bg-gray-50 p-6">
              <div className="relative h-full w-full">
                <img
                  src={preview}
                  alt="Preview"
                  className={`h-full w-full object-contain transition-transform duration-200 ${!disabled ? 'group-hover:scale-[1.02]' : ''}`}
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.maxHeight = '100%';
                    img.style.maxWidth = '100%';
                  }}
                />
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/20">
              <label 
                className={`flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-900 shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-sm transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white hover:shadow-md hover:ring-black/10'}`}>
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  {preview ? 'Change Image' : 'Upload Image'}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="sr-only"
                  accept="image/*"
                />
              </label>
            </div>
          </div>
        ) : (
          <label className="group flex h-full w-full cursor-pointer flex-col items-center justify-center space-y-4 p-8 text-center transition-colors hover:bg-gray-50">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-200 group-hover:bg-primary/20 group-hover:scale-105">
              <Upload className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-gray-700">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF (max 5MB)
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
          </label>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
