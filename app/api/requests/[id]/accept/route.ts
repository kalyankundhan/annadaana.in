// app/api/requests/[id]/accept/route.ts
import { connectDB } from "@/lib/db"
import { PostModel } from "@/models/Post"
import { RequestModel } from "@/models/Request"
import { UserModel } from "@/models/User"
import { requireUser } from "../../../_utils/auth"
import type { NextRequest } from "next/server"
import mongoose from "mongoose"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const body = await req.json()
  const { name, phone } = body || {}

  const reqDoc = await RequestModel.findById(id)
  if (!reqDoc) return new Response("Request not found", { status: 404 })
  const post = await PostModel.findById(reqDoc.postId)
  if (!post) return new Response("Post not found", { status: 404 })
  if (post.donorId !== user.uid) return new Response("Forbidden", { status: 403 })
  if (post.completed) return new Response("Post already completed", { status: 400 })

  // Ensure donor profile has name and phone
  const donorProfile = await UserModel.findOne({ uid: user.uid })
  const profileName = donorProfile?.name
  const profilePhone = donorProfile?.phone
  if ((!profileName || !profilePhone) && (!name || !phone)) {
    return new Response(
      JSON.stringify({ code: "PROFILE_INCOMPLETE", message: "Donor profile missing name or phone" }),
      { status: 400 },
    )
  }

  // Use provided or profile details
  const finalName = name || profileName
  const finalPhone = phone || profilePhone
  const finalAddress = donorProfile?.address || post.locationText

  // Accept current request
  reqDoc.status = "Accepted"
  reqDoc.donorDetails = { name: finalName!, phone: finalPhone!, address: finalAddress || "" }
  await reqDoc.save()

  // Mark post completed and reject others
  post.completed = true
  await post.save()
  await RequestModel.updateMany(
    { postId: new mongoose.Types.ObjectId(post._id), _id: { $ne: reqDoc._id }, status: "Pending" },
    { $set: { status: "Rejected" } },
  )

  return Response.json({ data: reqDoc })
}
