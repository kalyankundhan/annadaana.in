import { NextResponse } from 'next/server'
import { getAdminApp } from '@/lib/firebase-admin'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const idToken = authHeader.split(' ')[1]
    const app = getAdminApp()
    const auth = require('firebase-admin').auth(app)
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken)
    
    if (!decodedToken) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Generate a custom token
    const customToken = await auth.createCustomToken(decodedToken.uid)
    
    return new NextResponse(
      JSON.stringify({ token: customToken }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error getting auth token:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Failed to get authentication token' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
