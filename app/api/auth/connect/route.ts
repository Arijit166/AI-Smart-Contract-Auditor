import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import clientPromise from '@/lib/db'
import { createSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { walletAddress, chainId, signature } = await request.json()

    if (!walletAddress || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In production, verify the signature here
    // For now, we'll skip signature verification

    // Connect to database
    const client = await clientPromise
    const db = client.db('smart_contract_auditor')
    const users = db.collection('users')

    // Check if user exists, if not create
    const existingUser = await users.findOne({ walletAddress })
    
    if (!existingUser) {
      await users.insertOne({
        walletAddress,
        chainId,
        createdAt: new Date(),
        lastLogin: new Date(),
      })
    } else {
      await users.updateOne(
        { walletAddress },
        { 
          $set: { 
            lastLogin: new Date(),
            chainId 
          } 
        }
      )
    }

    // Create session token
    const token = await createSession(walletAddress, chainId)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({ 
      success: true,
      walletAddress,
      chainId 
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}