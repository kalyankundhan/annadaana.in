'use client';

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { FoodCard } from "@/components/food-card"
import { AuthProvider, useAuthedFetcher } from "@/components/auth-provider"
import { HowItWorks } from "@/components/how-it-works"
import { ArrowRight } from "lucide-react"
import { CardSkeleton } from "@/components/ui/card-skeleton"

function HeroSection() {
  const router = useRouter();
  
  return (
    <section className="relative h-[500px] w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/60" />
        <Image
          src="/placeholder.jpg"
          alt="Fresh produce and community"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="relative z-10 flex h-full items-center">
        <div className="mx-auto max-w-6xl px-4 text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Share More, Waste Less
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/90 sm:text-xl">
            Our community platform connects surplus food with those who need it most. 
            Join us in the fight against food waste.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-start">
            <Button 
              size="lg" 
              className="px-8 text-lg"
              onClick={() => router.push('/browse')}
            >
              Find Food Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 text-lg"
              onClick={() => router.push('/add')}
            >
              Donate Food
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function LatestDonations() {
  const fetcher = useAuthedFetcher()
  const { data, isLoading, mutate } = useSWR(
    `/api/posts?page=1&limit=6&includeRequested=true`, 
    fetcher
  )

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
      <section className="py-16">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Freshly Added</h2>
          <Button asChild variant="outline">
            <Link href="/browse" className="flex items-center">
              View All Donations
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((p: any) => (
              <FoodCard key={p._id} data={p} onChanged={() => mutate()} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function HomeContent() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <LatestDonations />
    </>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="min-h-screen">
        <HomeContent />
      </main>
    </AuthProvider>
  )
}
