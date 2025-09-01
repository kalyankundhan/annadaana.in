// app/api/requests/[id]/cancel/route.ts
import { connectDB } from "@/lib/db"
import { RequestModel } from "@/models/Request"
import { requireUser } from "../../../_utils/auth"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const doc = await RequestModel.findById(id)
  if (!doc) return new Response("Not found", { status: 404 })
  if (doc.requesterId !== user.uid) return new Response("Forbidden", { status: 403 })
  if (doc.status !== "Pending") return new Response("Cannot cancel", { status: 400 })
  doc.status = "Cancelled"
  await doc.save()
  return Response.json({ data: doc })
}
