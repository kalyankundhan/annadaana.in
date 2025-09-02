"use client"

import { Navbar } from "@/components/navbar"
import { AuthProvider, useAuthedFetcher } from "@/components/auth-provider"
import { FoodCard } from "@/components/food-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useSWRInfinite from "swr/infinite"
import { useEffect, useRef, useState, useCallback } from "react"
import { Search } from "lucide-react"
import { debounce } from "lodash"
import { CardSkeleton } from "@/components/ui/card-skeleton"

function BrowseContent() {
  const fetcher = useAuthedFetcher()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  
  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)
    
    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])
  
  const getKey = useCallback((pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null
    const page = pageIndex + 1
    return `/api/posts?page=${page}&limit=9&includeRequested=true&search=${encodeURIComponent(debouncedSearchTerm)}&sort=${sortBy}`
  }, [debouncedSearchTerm, sortBy])
  
  // Reset to first page when search or sort changes
  useEffect(() => {
    mutate(() => [], false)
  }, [debouncedSearchTerm, sortBy])
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
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Browse Donations</h1>
        <p className="text-muted-foreground max-w-2xl">
          Find fresh food donations available in your community. New items are added daily.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by food name or location..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-sm text-muted-foreground">Sort by:</span>
          <Select 
            value={sortBy === 'createdAt' ? 'newest' : 'expiring'}
            onValueChange={(value) => setSortBy(value === 'newest' ? 'createdAt' : 'expiryAt')}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {all.length === 0 && !isLoading ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No food donations found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && !data ? (
            [...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))
          ) : (
            all.map((p: any) => (
              <FoodCard key={p._id} data={p} onChanged={() => mutate()} />
            ))
          )}
          {(isLoading || (data && data[data.length - 1]?.hasMore)) && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3">
              <CardSkeleton />
            </div>
          )}
        </div>
      )}
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
