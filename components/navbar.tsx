"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"

export function Navbar() {
  const { 
    user, 
    signInGoogle, 
    signOutGoogle, 
    loading, 
    isSigningIn, 
    signInError, 
    clearSignInError 
  } = useAuth()
  const [localError, setLocalError] = useState<string | null>(null)
  
  // Auto-dismiss error messages after 3 seconds
  useEffect(() => {
    if (signInError || localError) {
      const timer = setTimeout(() => {
        setLocalError(null)
        clearSignInError()
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [signInError, localError, clearSignInError])
  
  const handleSignIn = async () => {
    setLocalError(null)
    const result = await signInGoogle()
    if (!result.success && result.error === 'popup-closed') {
      setLocalError('You canceled sign-in. Try again if you\'d like to continue.')
    } else if (!result.success && result.error === 'popup-blocked') {
      setLocalError('Please allow popups for this website to sign in with Google')
    } else if (!result.success && result.error === 'account-exists') {
      setLocalError('An account already exists with the same email but different sign-in credentials.')
    } else if (!result.success) {
      setLocalError('An error occurred during sign in. Please try again.')
    }
  }
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold">
          FoodShare
        </Link>
        <nav className="hidden items-center gap-4 md:flex">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>
          <NavLink href="/browse" active={pathname?.startsWith("/browse")}>
            BrowseFood
          </NavLink>
          <NavLink href="/my-donations" active={pathname?.startsWith("/my-donations")}>
            My Donations
          </NavLink>
          <NavLink href="/request" active={pathname?.startsWith("/request")}>
            Request
          </NavLink>
          <Button size="sm" onClick={() => router.push("/add")}>
            Add Food Donation
          </Button>
        </nav>
        <div className="flex items-center gap-3">
          {!user ? (
            <div className="relative">
              <div className="flex items-center">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSignIn} 
                  disabled={loading || isSigningIn}
                  className="whitespace-nowrap"
                >
                  {isSigningIn ? "Signing in..." : "Sign in with Google"}
                </Button>
              </div>
              {(signInError || localError) && (
                <div className="absolute right-0 mt-1 w-full min-w-max">
                  <p className="text-xs text-red-500 bg-background/90 backdrop-blur-sm px-2 py-1 rounded border border-red-200 shadow-sm">
                    {signInError || localError}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} />
                    <AvatarFallback>{user.displayName?.[0] ?? "U"}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.displayName || "User"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => location.assign("/profile")}>Profile</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOutGoogle}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      <div className="md:hidden border-t">
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-4 py-2">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>
          <NavLink href="/browse" active={pathname?.startsWith("/browse")}>
            BrowseFood
          </NavLink>
          <NavLink href="/my-donations" active={pathname?.startsWith("/my-donations")}>
            My Donations
          </NavLink>
          <NavLink href="/request" active={pathname?.startsWith("/request")}>
            Request
          </NavLink>
          <Button size="sm" onClick={() => location.assign("/add")}>
            Add
          </Button>
        </div>
      </div>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`text-sm ${active ? "font-medium" : "text-muted-foreground hover:text-foreground"} transition-colors`}
    >
      {children}
    </Link>
  )
}
