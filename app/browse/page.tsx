"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher } from "@/components/auth-provider"
import { FoodCard } from "@/components/food-card"
import useSWRInfinite from "swr/infinite"
import { useEffect, useRef } from "react"

function BrowseContent() {
  const fetcher = useAuthedFetcher()
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null
    const page = pageIndex + 1
    return `/api/posts?page=${page}&limit=9&includeRequested=true`
  }
  const { data, isLoading, size, setSize, mutate } = useSWRInfinite(getKey, fetcher)
  const all = data?.flatMap((d) => d.data) || []

  const sentinel = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setSize((s) => s + 1)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [setSize])

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold">Browse Food</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {all.map((p: any) => (
          <FoodCard key={p._id} data={p} onChanged={() => mutate()} />
        ))}
        {(isLoading || (data && data[data.length - 1]?.hasMore)) &&
          [...Array(3)].map((_, i) => <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />)}
      </div>
      <div ref={sentinel} className="h-8" />
    </main>
  )
}

export default function BrowsePage() {
  return (
    <AuthProvider>
      <Navbar />
      <BrowseContent />
    </AuthProvider>
  )
}
