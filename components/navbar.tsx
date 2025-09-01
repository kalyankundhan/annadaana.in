"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "./auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "next/navigation"
import { Menu, LogOut, User, Home, Utensils, HeartHandshake, MessageSquare, Plus, X } from "lucide-react"

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
    if (!result.success) {
      let errorMessage = 'An error occurred during sign in. Please try again.'
      
      if (result.error === 'popup-closed') {
        errorMessage = 'You canceled sign-in. Try again if you\'d like to continue.'
      } else if (result.error === 'popup-blocked') {
        errorMessage = 'Please allow popups for this website to sign in with Google'
      } else if (result.error === 'account-exists') {
        errorMessage = 'An account already exists with the same email but different sign-in credentials.'
      }
      
      setLocalError(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: errorMessage,
      })
    }
  }
  const pathname = usePathname()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Mobile Menu Button */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <FoodShareLogo />
            <span className="font-bold text-lg">FoodShare</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
            <NavLink href="/" active={pathname === "/"} icon={<Home className="h-4 w-4" />}>
              Home
            </NavLink>
            <NavLink href="/browse" active={pathname?.startsWith("/browse")} icon={<Utensils className="h-4 w-4" />}>
              Browse Food
            </NavLink>
            <NavLink href="/my-donations" active={pathname?.startsWith("/my-donations")} icon={<HeartHandshake className="h-4 w-4" />}>
              My Donations
            </NavLink>
            <NavLink href="/request" active={pathname?.startsWith("/request")} icon={<MessageSquare className="h-4 w-4" />}>
              Requests
            </NavLink>
          </nav>
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          <Button size="sm" onClick={() => router.push("/add")} className="gap-1">
            <Plus className="h-4 w-4" />
            <span>Add Donation</span>
          </Button>
          
          {!user ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSignIn} 
              disabled={loading || isSigningIn}
              className="gap-1"
            >
              {isSigningIn ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="sr-only">Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.displayName?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOutGoogle}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))}>
                    <FoodShareLogo />
                    <span className="font-bold">FoodShare</span>
                  </Link>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Close menu</span>
                    </Button>
                  </SheetTrigger>
                </div>
                
                <div className="flex-1 space-y-4">
                  <MobileNavLink href="/" icon={<Home className="h-4 w-4" />}>
                    Home
                  </MobileNavLink>
                  <MobileNavLink href="/browse" icon={<Utensils className="h-4 w-4" />}>
                    Browse Food
                  </MobileNavLink>
                  <MobileNavLink href="/my-donations" icon={<HeartHandshake className="h-4 w-4" />}>
                    My Donations
                  </MobileNavLink>
                  <MobileNavLink href="/request" icon={<MessageSquare className="h-4 w-4" />}>
                    Requests
                  </MobileNavLink>
                  <MobileNavLink href="/profile" icon={<User className="h-4 w-4" />}>
                    Profile
                  </MobileNavLink>
                </div>
                
                <div className="mt-auto pt-4 border-t">
                  {!user ? (
                    <Button 
                      onClick={handleSignIn} 
                      disabled={loading || isSigningIn}
                      className="w-full mb-4"
                    >
                      {isSigningIn ? 'Signing in...' : 'Sign In'}
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.displayName?.[0]?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{user.displayName || "User"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={signOutGoogle}>
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Sign out</span>
                      </Button>
                    </div>
                  )}
                  <Button 
                    onClick={() => {
                      router.push("/add")
                      document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))
                    }}
                    className="w-full mt-4 gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Donation
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

interface NavLinkProps {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  icon?: React.ReactElement<{ className?: string }>;
}

function NavLink({ 
  href, 
  active, 
  children, 
  icon
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'bg-accent text-accent-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      }`}
    >
      {icon && React.cloneElement(icon, { className: 'h-4 w-4' })}
      <span>{children}</span>
    </Link>
  )
}

interface MobileNavLinkProps {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactElement<{ className?: string }>;
}

function MobileNavLink({ 
  href, 
  children, 
  icon
}: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
      onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}))}
    >
      {icon && React.cloneElement(icon, { className: 'h-4 w-4' })}
      <span>{children}</span>
    </Link>
  )
}

function FoodShareLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 11.71 4.02 11.42 4.05 11.14C6.41 12.41 9.11 13 12 13C14.89 13 17.59 12.41 19.95 11.14C19.98 11.42 20 11.71 20 12C20 16.41 16.41 20 12 20Z"
        fill="currentColor"
      />
      <path
        d="M8 10C8 8.9 8.9 8 10 8C11.1 8 12 8.9 12 10C12 11.1 11.1 12 10 12C8.9 12 8 11.1 8 10Z"
        fill="currentColor"
      />
      <path
        d="M12 4C13.1 4 14 4.9 14 6C14 7.1 13.1 8 12 8C10.9 8 10 7.1 10 6C10 4.9 10.9 4 12 4Z"
        fill="currentColor"
      />
      <path
        d="M14 14C14 12.9 13.1 12 12 12C10.9 12 10 12.9 10 14C10 15.1 10.9 16 12 16C13.1 16 14 15.1 14 14Z"
        fill="currentColor"
      />
      <path
        d="M18 10C18 8.9 17.1 8 16 8C14.9 8 14 8.9 14 10C14 11.1 14.9 12 16 12C17.1 12 18 11.1 18 10Z"
        fill="currentColor"
      />
    </svg>
  )
}
