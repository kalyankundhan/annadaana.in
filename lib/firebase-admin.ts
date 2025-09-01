// lib/firebase-admin.ts
// Firebase Admin to verify ID tokens in API routes
import { type App, cert, getApps, initializeApp } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

let app: App | undefined

export function getAdminApp() {
  if (getApps().length) return getApps()[0]
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are missing")
  }
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })
}

export async function verifyIdToken(authorizationHeader?: string) {
  if (!authorizationHeader?.startsWith("Bearer ")) return null
  const idToken = authorizationHeader.split(" ")[1]
  app = app || getAdminApp()
  try {
    const decoded = await getAuth(app).verifyIdToken(idToken)
    return decoded // contains uid, email, name, etc.
  } catch (e) {
    return null
  }
}
