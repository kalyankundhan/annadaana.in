'use client';

// Home Page
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import useSWR from "swr"
import { FoodCard } from "@/components/food-card"
import { AuthProvider, useAuthedFetcher } from "@/components/auth-provider"

function HomeContent() {
  const fetcher = useAuthedFetcher()
  const { data, isLoading, mutate } = useSWR(`/api/posts?page=1&limit=6&includeRequested=true`, fetcher)

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <section className="grid gap-3">
        <h1 className="text-balance text-2xl font-bold">Welcome to FoodShare</h1>
        <p className="text-pretty text-muted-foreground">
          Reduce food wastage by donating leftovers or requesting available food from your community.
        </p>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-semibold">Latest Donations</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {data?.data?.map((p: any) => (
              <FoodCard key={p._id} data={p} onChanged={() => mutate()} />
            ))}
          </div>
        )}
        <div className="mt-4">
          <Link className="text-sm font-medium underline" href="/browse">
            View All Donations
          </Link>
        </div>
      </section>
    </main>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <Navbar />
      <HomeContent />
    </AuthProvider>
  )
}
