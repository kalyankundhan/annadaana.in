// app/api/requests/stats/route.ts
import { connectDB } from "@/lib/db"
import { RequestModel } from "@/models/Request"
import { requireUser } from "../../_utils/auth"
import type { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const { user, error } = await requireUser(req as any)
  if (error) return error
  await connectDB()
  const [sentPendingCount, receivedPendingCount] = await Promise.all([
    RequestModel.countDocuments({ requesterId: user.uid, status: "Pending" }),
    RequestModel.countDocuments({ donorId: user.uid, status: "Pending" }),
  ])
  return Response.json({ data: { sentPendingCount, receivedPendingCount } })
}
