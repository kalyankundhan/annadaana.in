"use client"

import { type ReactNode, useEffect, useState } from "react"
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase-client"

type AuthContextValue = {
  user: User | null
  loading: boolean
  isSigningIn: boolean
  signInError: string | null
  signInGoogle: () => Promise<{ success: boolean; error?: string }>
  clearSignInError: () => void
  signOutGoogle: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

import { createContext, useContext } from "react"

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const [isSigningIn, setIsSigningIn] = useState(false)
  const [signInError, setSignInError] = useState<string | null>(null)

  const clearSignInError = () => {
    setSignInError(null)
  }

  const signInGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    // Prevent multiple sign-in attempts
    if (isSigningIn) return { success: false, error: 'Sign in already in progress' }
    
    setIsSigningIn(true)
    setSignInError(null)
    
    try {
      // Clear any existing auth state to prevent conflicts
      await auth.signOut()
      
      // Add a small delay to ensure the sign-out is processed
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Try sign-in with popup
      await signInWithPopup(auth, googleProvider)
      return { success: true }
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        setSignInError('You canceled sign-in. Try again if you\'d like to continue.')
        return { success: false, error: 'popup-closed' }
      } else if (error.code === 'auth/cancelled-popup-request') {
        // This can happen if multiple popups are opened
        // Sign-in popup was cancelled by user
        return { success: false, error: 'popup-cancelled' }
      } else if (error.code === 'auth/popup-blocked') {
        const message = 'Please allow popups for this website to sign in with Google'
        setSignInError(message)
        return { success: false, error: 'popup-blocked' }
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        const message = 'An account already exists with the same email but different sign-in credentials.'
        setSignInError(message)
        return { success: false, error: 'account-exists' }
      } else {
        // For any other errors, show a generic message
        const message = 'An error occurred during sign in. Please try again.'
        setSignInError(message)
        return { success: false, error: error.code || 'unknown-error' }
      }
    } finally {
      setIsSigningIn(false)
    }
  }
  const signOutGoogle = async () => {
    await signOut(auth)
  }
  const getIdToken = async () => {
    if (!auth.currentUser) return null
    return await auth.currentUser.getIdToken()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isSigningIn,
      signInError,
      signInGoogle,
      clearSignInError,
      signOutGoogle, 
      getIdToken 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

// SWR fetcher that injects Authorization Bearer token automatically
export function useAuthedFetcher() {
  const { getIdToken } = useAuth()
  const fetcher = async (url: string, opts?: RequestInit) => {
    const token = await getIdToken()
    const res = await fetch(url, {
      ...(opts || {}),
      headers: {
        ...(opts?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) {
      throw new Error(await res.text())
    }
    // Don't try to parse JSON for 204 No Content responses
    if (res.status === 204) {
      return null
    }
    return res.json()
  }
  return fetcher
}
