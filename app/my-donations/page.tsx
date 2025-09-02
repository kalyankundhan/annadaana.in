"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher, useAuth } from "@/components/auth-provider"
import useSWR from "swr"
import { FoodCard } from "@/components/food-card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { PageLoader } from "@/components/ui/page-loader"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function MyDonationsContent() {
  const fetcher = useAuthedFetcher()
  const { user, loading: authLoading, signInGoogle } = useAuth()
  const { data, isLoading, mutate } = useSWR(
    user ? `/api/posts?page=1&limit=100&includeRequested=false` : null,
    fetcher
  )
  const mine = (data?.data || []).filter((p: any) => p.donorId === user?.uid)

  const [savingId, setSavingId] = useState<string | null>(null)

  const [postToDelete, setPostToDelete] = useState<string | null>(null)

  const handleDeleteClick = (id: string) => {
    setPostToDelete(id)
  }

  const handleCancelDelete = () => {
    setPostToDelete(null)
  }

  const confirmDelete = async () => {
    if (!postToDelete) return
    
    setSavingId(postToDelete)
    try {
      await fetcher(`/api/posts/${postToDelete}`, { method: "DELETE" })
      mutate()
    } catch (e: any) {
      alert(e.message || "Failed to delete post. Please try again.")
    } finally {
      setSavingId(null)
      setPostToDelete(null)
    }
  }

  if (authLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 text-center">
        <h1 className="text-2xl font-bold">Sign In Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to view and manage your donations.</p>
        <Button onClick={() => signInGoogle()} className="mt-4">
          Sign in with Google
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">My Donations</h1>
        <p className="text-muted-foreground">
          Manage your food donations and track their status.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : mine.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground mb-4">You haven't made any donations yet.</p>
          <Button onClick={() => location.assign('/add')}>Add Your First Donation</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map((p: any) => (
            <FoodCard 
              key={p._id} 
              data={{ ...p, requestedByMe: false }} 
              showActions={false} 
              isOwner 
              showOwnerActions={true}
              onChanged={() => mutate()}
              onDelete={async () => {
                handleDeleteClick(p._id)
              }}
            />
          ))}
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the donation and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

export default function MyDonationsPage() {
  return (
    <AuthProvider>
      <Navbar />
      <MyDonationsContent />
    </AuthProvider>
  )
}
