"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher, useAuth } from "@/components/auth-provider"
import useSWRInfinite from "swr/infinite"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AcceptModal } from "@/components/accept-modal"
import { useState } from "react"
import { CalendarDays, User, Phone, MapPin, Clock } from "lucide-react"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { PageLoader } from "@/components/ui/page-loader"

function StatusBadge({ status }: { status: string }) {
  const statusMap: any = {
    'Pending': 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    'Accepted': 'bg-green-100 text-green-800 hover:bg-green-100',
    'Rejected': 'bg-red-100 text-red-800 hover:bg-red-100',
    'Cancelled': 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  }

  return (
    <Badge className={`${statusMap[status] || 'bg-gray-100'} text-xs font-medium`}>
      {status}
    </Badge>
  )
}

function List({ tab }: { tab: "sent" | "received" }) {
  const { user } = useAuth()
  const fetcher = useAuthedFetcher()
  const getKey = (pageIndex: number, prev: any) => {
    if (!user) return null; // Don't fetch if not logged in
    if (prev && !prev.hasMore) return null
    const page = pageIndex + 1
    return `/api/requests?tab=${tab}&page=${page}&limit=10`
  }
  const { data, size, setSize, mutate, isLoading } = useSWRInfinite(getKey, fetcher)
  const items = data?.flatMap((d) => d.data) || []
  const [canceling, setCanceling] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)

  if (items.length === 0 && !isLoading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          {tab === 'sent' 
            ? "You have no sent requests." 
            : "No one has requested your donations yet."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((r: any) => (
        <Card key={r._id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{r.post?.foodName || "Unnamed Food"}</CardTitle>
                <StatusBadge status={r.status} />
              </div>
              
              {r.status === 'Accepted' && r.donorDetails && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{r.donorDetails.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{r.donorDetails.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{r.donorDetails.address}</span>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Expires: {r.post?.expiryAt ? new Date(r.post.expiryAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Requested: {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>
          </CardContent>
          
          {(tab === 'sent' || tab === 'received') && r.status === 'Pending' && (
            <CardFooter className="flex justify-end gap-2 border-t bg-muted/20 p-4">
              {tab === 'sent' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setCanceling(r._id)
                    try {
                      await fetcher(`/api/requests/${r._id}/cancel`, { method: 'POST' })
                      mutate()
                    } catch (e: any) {
                      alert(e.message || 'Failed to cancel')
                    } finally {
                      setCanceling(null)
                    }
                  }}
                  disabled={canceling === r._id}
                >
                  {canceling === r._id ? 'Cancelling...' : 'Cancel Request'}
                </Button>
              ) : (
                <>
                  <AcceptModal requestId={r._id} address={r.post?.locationText} onAccepted={() => mutate()} />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      setRejecting(r._id)
                      try {
                        await fetcher(`/api/requests/${r._id}/reject`, { method: 'POST' })
                        mutate()
                      } catch (e: any) {
                        alert(e.message || 'Failed to reject')
                      } finally {
                        setRejecting(null)
                      }
                    }}
                    disabled={rejecting === r._id}
                  >
                    {rejecting === r._id ? 'Rejecting...' : 'Reject'}
                  </Button>
                </>
              )}
            </CardFooter>
          )}
        </Card>
      ))}
      
      {(isLoading || (data && data[data.length - 1]?.hasMore)) && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      
      {data && data[data.length - 1]?.hasMore && (
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={() => setSize(size + 1)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}

function RequestContent() {
  const { user, loading: authLoading } = useAuth()
  const fetcher = useAuthedFetcher()
  const { data: stats, mutate: refreshStats } = useSWR(
    user ? "/api/requests/stats" : null, // Only fetch if user exists
    fetcher, 
    { refreshInterval: 15000 }
  )
  const [tab, setTab] = useState<"sent" | "received">("sent")
  const sentCount = stats?.data?.sentPendingCount || 0
  const receivedCount = stats?.data?.receivedPendingCount || 0

  if (authLoading) {
    return <PageLoader />
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 text-center">
        <h1 className="text-2xl font-bold">Sign In Required</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to view and manage your requests.</p>
        <Button onClick={() => window.location.href = '/login'} className="mt-4">
          Sign In
        </Button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground">
          {tab === 'sent' 
            ? 'View and manage your food requests.' 
            : 'Manage incoming requests for your donations.'}
        </p>
      </div>
      
      <Tabs 
        defaultValue="sent" 
        value={tab}
        onValueChange={(value) => {
          setTab(value as "sent" | "received")
          refreshStats()
        }}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="sent" className="relative">
            Sent
            {sentCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {sentCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="received" className="relative">
            Received
            {receivedCount > 0 && (
              <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {receivedCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="sent">
            <List tab="sent" />
          </TabsContent>
          <TabsContent value="received">
            <List tab="received" />
          </TabsContent>
        </div>
      </Tabs>
    </main>
  )
}

export default function RequestPage() {
  return (
    <AuthProvider>
      <Navbar />
      <RequestContent />
    </AuthProvider>
  )
}
