"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher, useAuth } from "@/components/auth-provider"
import useSWR from "swr"
import { FoodCard } from "@/components/food-card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
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
  const { user } = useAuth()
  const { data, isLoading, mutate } = useSWR(`/api/posts?page=1&limit=100&includeRequested=false`, fetcher)
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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold">My Donations</h1>
      {isLoading ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : mine.length === 0 ? (
        <p className="mt-4 text-muted-foreground">No posts yet. Add your first donation.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {mine.map((p: any) => (
            <div key={p._id} className="flex flex-col">
              <FoodCard data={{ ...p, requestedByMe: false }} showActions={false} isOwner onChanged={() => mutate()} />
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => location.assign(`/add?id=${p._id}`)}>
                  Edit
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleDeleteClick(p._id)} 
                  disabled={savingId === p._id}
                >
                  {savingId === p._id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
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
