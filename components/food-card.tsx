"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useAuth, useAuthedFetcher } from "./auth-provider"
import { useState, useEffect } from "react"
import { CalendarDays, MapPin, Clock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"

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
  showOwnerActions = false,
  onDelete,
}: {
  data: FoodCardData
  onChanged?: () => void
  showActions?: boolean
  isOwner?: boolean
  showOwnerActions?: boolean
  onDelete?: () => Promise<void> | void
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
    <div className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <div className="relative h-full w-full overflow-hidden">
          <Image
            src={data.photoUrl || "/placeholder.svg?height=200&width=400&query=food+donation"}
            alt={data.foodName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {data.completed && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Badge variant="secondary" className="bg-green-600/90 text-white hover:bg-green-600/80">
                Claimed
              </Badge>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold leading-tight tracking-tight text-foreground">
              {data.foodName}
            </h3>
          </div>
          
          <p className="text-muted-foreground line-clamp-3 leading-relaxed">
            {data.description.split(' ').length > 25 
              ? `${data.description.split(' ').slice(0, 25).join(' ')}...` 
              : data.description}
          </p>
        </div>
        
        <div className="mt-4 space-y-3 pt-2 border-t">
          {!data.completed && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <ExpiryStatusBadge expiryAt={data.expiryAt} />
            </div>
          )}
          
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground line-clamp-2">{data.locationText}</span>
          </div>
          
          <div className="mt-4 space-y-2">
            {showActions && !computedIsOwner && !data.completed && (
              <Button 
                onClick={toggleRequest} 
                disabled={loading} 
                className="w-full"
                size="sm"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Please wait...
                  </span>
                ) : data.requestedByMe ? (
                  "Cancel Request"
                ) : (
                  "Request This Food"
                )}
              </Button>
            )}
            
            {showOwnerActions && onDelete && (
              <TooltipProvider>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="w-full">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            if (!data.completed && new Date(data.expiryAt) >= new Date()) {
                              location.assign(`/add?id=${data._id}`)
                            }
                          }}
                          disabled={data.completed || new Date(data.expiryAt) < new Date()}
                        >
                          Edit
                        </Button>
                      </span>
                    </TooltipTrigger>
                    {(data.completed || new Date(data.expiryAt) < new Date()) && (
                      <TooltipContent>
                        <p className="text-sm">
                          {data.completed
                            ? "This donation has been completed and cannot be edited."
                            : "This donation has expired and cannot be edited."}
                        </p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="flex-1"
                    onClick={onDelete}
                  >
                    Delete
                  </Button>
                </div>
              </TooltipProvider>
            )}
          </div>
        </div>
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
    if (!timeLeft) return { text: 'Loading...', variant: 'secondary' as const }
    
    if (timeLeft.isExpired) {
      return { text: 'Expired', variant: 'destructive' as const }
    }
    
    if (timeLeft.hours >= 24) {
      return { text: 'Available', variant: 'secondary' as const }
    }
    
    if (timeLeft.hours > 0) {
      return { 
        text: `${timeLeft.hours}h ${timeLeft.minutes}m left`, 
        variant: 'default' as const
      }
    }
    
    return { 
      text: `${timeLeft.minutes}m left`, 
      variant: 'default' as const
    }
  }

  const status = getStatusInfo()

  return (
    <Badge variant={status.variant} className="text-xs font-medium">
      {status.text}
    </Badge>
  )
}
