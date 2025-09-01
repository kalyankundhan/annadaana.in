// app/api/profile/route.ts
import { connectDB } from "@/lib/db"
import { UserModel } from "@/models/User"
import { requireUser } from "../_utils/auth"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const existing = await UserModel.findOne({ uid: user.uid }).lean()
  if (!existing) {
    // Create on first visit based on Google profile
    const created = await UserModel.create({
      uid: user.uid,
      name: user.name || user.email?.split("@")[0] || "User",
      email: user.email,
      phone: null,
      address: "",
    })
    return Response.json({ data: created })
  }
  return Response.json({ data: existing })
}

export async function PUT(req: NextRequest) {
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const body = await req.json()
  const { name, phone, address } = body || {}
  const updated = await UserModel.findOneAndUpdate(
    { uid: user.uid },
    { $set: { name, phone, address } },
    { new: true, upsert: true },
  ).lean()
  return Response.json({ data: updated })
}
