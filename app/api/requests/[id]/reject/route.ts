// app/api/requests/[id]/reject/route.ts
import { connectDB } from "@/lib/db"
import { RequestModel } from "@/models/Request"
import { PostModel } from "@/models/Post"
import { requireUser } from "../../../_utils/auth"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const r = await RequestModel.findById(id)
  if (!r) return new Response("Not found", { status: 404 })
  const post = await PostModel.findById(r.postId)
  if (!post) return new Response("Post not found", { status: 404 })
  if (post.donorId !== user.uid) return new Response("Forbidden", { status: 403 })
  if (r.status !== "Pending") return new Response("Cannot reject", { status: 400 })
  r.status = "Rejected"
  await r.save()
  return Response.json({ data: r })
}
