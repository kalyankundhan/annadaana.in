// app/api/requests/route.ts
import { connectDB } from "@/lib/db"
import { PostModel } from "@/models/Post"
import { RequestModel } from "@/models/Request"
import { requireUser } from "../_utils/auth"
import type { NextRequest } from "next/server"
import mongoose from "mongoose"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()

  const { searchParams } = new URL(req.url)
  const tab = searchParams.get("tab") || "sent" // sent | received
  const page = Number(searchParams.get("page") || 1)
  const limit = Number(searchParams.get("limit") || 10)
  const skip = (page - 1) * limit

  const filter = tab === "received" ? { donorId: user.uid } : { requesterId: user.uid }

  const reqs = await RequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()

  // Join posts minimal fields
  const postIds = reqs.map((r) => r.postId)
  const posts = await PostModel.find({ _id: { $in: postIds } })
    .select("foodName expiryAt donorName locationText")
    .lean()
  const postMap = Object.fromEntries(posts.map((p) => [String(p._id), p]))

  const data = reqs.map((r: any) => ({
    ...r,
    post: postMap[String(r.postId)] || null,
  }))

  return Response.json({ data, page, limit, hasMore: reqs.length === limit })
}

// POST toggles request create/cancel when body has { postId, action }
// action: "request" | "cancel"
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const body = await req.json()
  const { postId, action } = body || {}
  if (!postId || !action) return new Response("Missing fields", { status: 400 })
  const post = await PostModel.findById(postId)
  if (!post) return new Response("Post not found", { status: 404 })
  if (post.donorId === user.uid) return new Response("Cannot request your own post", { status: 400 })
  if (post.completed) return new Response("Post already completed", { status: 400 })

  if (action === "request") {
    const existing = await RequestModel.findOne({
      postId: new mongoose.Types.ObjectId(postId),
      requesterId: user.uid,
      status: { $in: ["Pending", "Accepted"] },
    })
    if (existing) return Response.json({ data: existing })
    const created = await RequestModel.create({
      postId: post._id,
      donorId: post.donorId,
      requesterId: user.uid,
      status: "Pending",
    })
    return Response.json({ data: created })
  } else if (action === "cancel") {
    const reqDoc = await RequestModel.findOne({
      postId: new mongoose.Types.ObjectId(postId),
      requesterId: user.uid,
      status: { $in: ["Pending"] },
    })
    if (!reqDoc) return new Response("No pending request", { status: 404 })
    reqDoc.status = "Cancelled"
    await reqDoc.save()
    return Response.json({ data: reqDoc })
  }

  return new Response("Invalid action", { status: 400 })
}
