"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useAuth, useAuthedFetcher } from "./auth-provider"
import { useState, useEffect } from "react"

export type FoodCardData = {
  _id: string
  donorId: string
  donorName: string
  foodName: string
  description: string
  photoUrl: string
  expiryAt: string
  locationText: string
  requestedByMe?: boolean
  completed?: boolean
}

export function FoodCard({
  data,
  onChanged,
  showActions = true,
  isOwner = false,
}: {
  data: FoodCardData
  onChanged?: () => void
  showActions?: boolean
  isOwner?: boolean
}) {
  const { user } = useAuth()
  const fetcher = useAuthedFetcher()
  const [loading, setLoading] = useState(false)

  const computedIsOwner = isOwner || (!!user && user.uid === data.donorId)

  const toggleRequest = async () => {
    if (!user) return alert("Please sign in to request")
    setLoading(true)
    try {
      const action = data.requestedByMe ? "cancel" : "request"
      await fetcher("/api/requests", {
        method: "POST",
        body: JSON.stringify({ postId: data._id, action }),
        headers: { "Content-Type": "application/json" },
      })
      onChanged?.()
    } catch (e: any) {
      alert(e.message || "Error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
        <Image
          src={data.photoUrl || "/placeholder.svg?height=200&width=400&query=food+donation"}
          alt={data.foodName}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-pretty text-base font-semibold">{data.foodName}</h3>
          {data.completed ? (
            <span className="rounded bg-green-600/10 px-2 py-0.5 text-xs text-green-700">Completed</span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 text-ellipsis overflow-hidden">
          {data.description.split(' ').length > 25 
            ? `${data.description.split(' ').slice(0, 25).join(' ')}...` 
            : data.description}
        </p>
        <div className="mt-auto grid gap-1 text-sm">
          {!data.completed && (
            <ExpiryStatusBadge expiryAt={data.expiryAt} />
          )}
          <div>
            <span className="text-muted-foreground">Location:</span> {data.locationText}
          </div>
        </div>
        {showActions && !computedIsOwner && !data.completed ? (
          <Button onClick={toggleRequest} disabled={loading} className="mt-2">
            {loading ? "Please wait..." : data.requestedByMe ? "Cancel Request" : "Request"}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function ExpiryStatusBadge({ expiryAt }: { expiryAt: string }) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number
    minutes: number
    isExpired: boolean
  } | null>(null)

  useEffect(() => {
    const updateTimeLeft = () => {
      const expiryDate = new Date(expiryAt).getTime()
      const now = new Date().getTime()
      const difference = expiryDate - now
      
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, isExpired: true })
        return
      }
      
      const hours = Math.floor(difference / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      setTimeLeft({ hours, minutes, isExpired: false })
    }

    // Initial update
    updateTimeLeft()

    // Only set up interval if the item is not expired and has less than 24 hours left
    if (timeLeft && !timeLeft.isExpired && timeLeft.hours < 24) {
      const timer = setInterval(updateTimeLeft, 60000) // Update every minute
      return () => clearInterval(timer)
    }
  }, [expiryAt, timeLeft?.hours])

  const getStatusInfo = () => {
    if (!timeLeft) return { text: 'Loading...', className: 'bg-gray-100 text-gray-800' }
    
    if (timeLeft.isExpired) {
      return { text: 'Expired', className: 'bg-red-100 text-red-800' }
    }
    
    if (timeLeft.hours >= 24) {
      return { text: 'Available', className: 'bg-green-100 text-green-800' }
    }
    
    if (timeLeft.hours > 0) {
      return { 
        text: `Expires in ${timeLeft.hours} hour${timeLeft.hours > 1 ? 's' : ''}`, 
        className: 'bg-amber-100 text-amber-800' 
      }
    }
    
    return { 
      text: `Expires in ${timeLeft.minutes} minute${timeLeft.minutes !== 1 ? 's' : ''}`, 
      className: 'bg-amber-100 text-amber-800' 
    }
  }

  const status = getStatusInfo()

  return (
    <div className="flex items-center">
      <span className="text-muted-foreground text-sm mr-1">Status:</span>
      <span className={`text-xs ${status.className.split(' ').filter(c => c.includes('text-')).join(' ')}`}>
        {status.text}
      </span>
    </div>
  )
}
