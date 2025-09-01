// lib/db.ts
// Mongoose connection helper
import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI as string
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set")
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseConn: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
}

let cached = global.mongooseConn
if (!cached) {
  cached = global.mongooseConn = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      // @ts-ignore
      dbName: "foodshare",
    })
  }
  cached.conn = await cached.promise
  return cached.conn
}
