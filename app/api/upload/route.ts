// app/api/upload/route.ts
// Accepts multipart/form-data with "file" (<=5MB). Uploads to Cloudinary and returns URL.
import type { NextRequest } from "next/server"
import { requireUser } from "../_utils/auth"
import { cloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(req as any)
  if (error) return error

  const form = await req.formData()
  const file = form.get("file") as unknown as Blob
  if (!file) return new Response("Missing file", { status: 400 })
  if (file.size > 5 * 1024 * 1024) return new Response("File too large", { status: 400 })

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const res: any = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "foodshare",
          resource_type: "image",
        },
        (err, result) => {
          if (err) reject(err)
          else resolve(result)
        },
      )
      .end(buffer)
  })

  return Response.json({ url: res.secure_url })
}
