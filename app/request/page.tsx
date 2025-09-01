"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher } from "@/components/auth-provider"
import useSWRInfinite from "swr/infinite"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { AcceptModal } from "@/components/accept-modal"
import { useState } from "react"

function Badge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
      {count}
    </span>
  )
}

function List({ tab }: { tab: "sent" | "received" }) {
  const fetcher = useAuthedFetcher()
  const getKey = (pageIndex: number, prev: any) => {
    if (prev && !prev.hasMore) return null
    const page = pageIndex + 1
    return `/api/requests?tab=${tab}&page=${page}&limit=10`
  }
  const { data, size, setSize, mutate, isLoading } = useSWRInfinite(getKey, fetcher)
  const items = data?.flatMap((d) => d.data) || []
  const [canceling, setCanceling] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)

  return (
    <div className="grid gap-3">
      {items.map((r: any) => (
        <div key={r._id} className="flex flex-col rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Food: {r.post?.foodName || "N/A"}</div>
              <div className="text-xs text-muted-foreground">
                Expiry: {r.post?.expiryAt ? new Date(r.post.expiryAt).toLocaleString() : "-"}
              </div>
              <div className="text-xs text-muted-foreground">Status: {r.status}</div>
              {r.status === "Accepted" && r.donorDetails ? (
                <div className="text-xs text-green-700">
                  Donor: {r.donorDetails.name} · {r.donorDetails.phone} · {r.donorDetails.address}
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {tab === "sent" && r.status === "Pending" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    setCanceling(r._id)
                    try {
                      await fetcher(`/api/requests/${r._id}/cancel`, { method: "POST" })
                      mutate()
                    } catch (e: any) {
                      alert(e.message || "Failed to cancel")
                    } finally {
                      setCanceling(null)
                    }
                  }}
                  disabled={canceling === r._id}
                >
                  {canceling === r._id ? "Cancelling..." : "Cancel"}
                </Button>
              ) : null}
              {tab === "received" && r.status === "Pending" ? (
                <>
                  <AcceptModal requestId={r._id} address={r.post?.locationText} onAccepted={() => mutate()} />
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={async () => {
                      setRejecting(r._id)
                      try {
                        await fetcher(`/api/requests/${r._id}/reject`, { method: "POST" })
                        mutate()
                      } catch (e: any) {
                        alert(e.message || "Failed to reject")
                      } finally {
                        setRejecting(null)
                      }
                    }}
                    disabled={rejecting === r._id}
                  >
                    {rejecting === r._id ? "Rejecting..." : "Reject"}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ))}
      {(isLoading || (data && data[data.length - 1]?.hasMore)) && (
        <div className="h-12 animate-pulse rounded bg-muted" />
      )}
      <div className="flex justify-center">
        {data && data[data.length - 1]?.hasMore ? (
          <Button variant="ghost" onClick={() => setSize(size + 1)}>
            Load more
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function RequestContent() {
  const fetcher = useAuthedFetcher()
  const { data: stats, mutate: refreshStats } = useSWR("/api/requests/stats", fetcher, { refreshInterval: 15000 })
  const [tab, setTab] = useState<"sent" | "received">("sent")
  const sentCount = stats?.data?.sentPendingCount || 0
  const receivedCount = stats?.data?.receivedPendingCount || 0

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Requests</h1>
        <div className="flex gap-2">
          <Button
            variant={tab === "sent" ? "default" : "outline"}
            onClick={() => {
              setTab("sent")
              refreshStats()
            }}
          >
            Sent <Badge count={sentCount} />
          </Button>
          <Button
            variant={tab === "received" ? "default" : "outline"}
            onClick={() => {
              setTab("received")
              refreshStats()
            }}
          >
            Received <Badge count={receivedCount} />
          </Button>
        </div>
      </div>
      <List tab={tab} />
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
