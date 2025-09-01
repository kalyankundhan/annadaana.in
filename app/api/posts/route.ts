// app/api/posts/route.ts
import { connectDB } from "@/lib/db"
import { PostModel } from "@/models/Post"
import { RequestModel } from "@/models/Request"
import { requireUser } from "../_utils/auth"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") || 1)
  const limit = Number(searchParams.get("limit") || 10)
  const includeRequested = searchParams.get("includeRequested") === "true"
  const search = searchParams.get("search") || ""
  const sort = searchParams.get("sort") || "createdAt"
  const skip = (page - 1) * limit
  
  // Build filter
  const filter: any = {}
  if (search) {
    filter.$or = [
      { foodName: { $regex: search, $options: 'i' } },
      { locationText: { $regex: search, $options: 'i' } }
    ]
  }
  
  // Build sort
  const sortOption: any = {}
  if (sort === 'expiryAt') {
    sortOption.expiryAt = 1 // Sort by expiry date ascending (earliest first)
  } else {
    sortOption.createdAt = -1 // Default: sort by newest first
  }

  const authHeader = req.headers.get("authorization") || undefined
  let uid: string | null = null
  // tolerate unauthenticated listing
  try {
    const { user } = await requireUser(new Request(req.url, { headers: req.headers as any }))
    uid = user?.uid || null
  } catch {
    uid = null
  }

  const posts = await PostModel.find(filter).sort(sortOption).skip(skip).limit(limit).lean()
  let requestedMap: Record<string, boolean> = {}
  if (includeRequested && uid) {
    const postIds = posts.map((p) => p._id)
    const reqs = await RequestModel.find({
      requesterId: uid,
      postId: { $in: postIds },
      status: { $in: ["Pending", "Accepted"] },
    })
      .select("postId")
      .lean()
    requestedMap = Object.fromEntries(reqs.map((r) => [String(r.postId), true]))
  }

  return Response.json({
    data: posts.map((p: any) => ({
      ...p,
      requestedByMe: requestedMap[String(p._id)] || false,
    })),
    page,
    limit,
    hasMore: posts.length === limit,
  })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const body = await req.json()
  const { foodName, description, photoUrl, expiryAt, locationText, lat, lng } = body || {}
  if (!foodName || !description || !photoUrl || !expiryAt || !locationText || lat == null || lng == null) {
    return new Response("Missing fields", { status: 400 })
  }
  const doc = await PostModel.create({
    donorId: user.uid,
    donorName: user.name || user.email?.split("@")[0] || "Donor",
    foodName,
    description,
    photoUrl,
    expiryAt: new Date(expiryAt),
    locationText,
    lat,
    lng,
    completed: false,
  })
  return Response.json({ data: doc })
}
