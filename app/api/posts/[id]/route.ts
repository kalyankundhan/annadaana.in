// app/api/posts/[id]/route.ts
import { connectDB } from "@/lib/db"
import { PostModel } from "@/models/Post"
import { RequestModel } from "@/models/Request"
import { requireUser } from "../../_utils/auth"
import type { NextRequest } from "next/server"
import mongoose from "mongoose"

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  await connectDB()
  const post = await PostModel.findById(id).lean()
  if (!post) return new Response("Not found", { status: 404 })
  return Response.json({ data: post })
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const post = await PostModel.findById(id)
  if (!post) return new Response("Not found", { status: 404 })
  if (post.donorId !== user.uid) return new Response("Forbidden", { status: 403 })

  const body = await req.json()
  const { foodName, description, photoUrl, expiryAt, locationText, lat, lng, completed } = body || {}
  post.foodName = foodName ?? post.foodName
  post.description = description ?? post.description
  post.photoUrl = photoUrl ?? post.photoUrl
  post.expiryAt = expiryAt ? new Date(expiryAt) : post.expiryAt
  post.locationText = locationText ?? post.locationText
  post.lat = lat ?? post.lat
  post.lng = lng ?? post.lng
  if (typeof completed === "boolean") post.completed = completed
  await post.save()
  return Response.json({ data: post })
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const post = await PostModel.findById(id)
  if (!post) return new Response("Not found", { status: 404 })
  if (post.donorId !== user.uid) return new Response("Forbidden", { status: 403 })
  await RequestModel.deleteMany({ postId: new mongoose.Types.ObjectId(id) })
  await PostModel.findByIdAndDelete(id)
  return new Response(null, { status: 204 })
}
