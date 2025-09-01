// app/api/_utils/auth.ts
import { verifyIdToken } from "@/lib/firebase-admin"

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || undefined
  const decoded = await verifyIdToken(authHeader)
  if (!decoded) {
    return { user: null as any, error: new Response("Unauthorized", { status: 401 }) }
  }
  return { user: decoded, error: null }
}
