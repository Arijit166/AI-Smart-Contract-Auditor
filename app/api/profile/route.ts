import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { UserProfileCollection } from '@/lib/models/UserProfile'

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection(UserProfileCollection)

    const profile = await collection.findOne({ walletAddress })

    if (!profile) {
      return NextResponse.json({
        success: true,
        profile: null,
      })
    }

    return NextResponse.json({
      success: true,
      profile: {
        name: profile.name,
        profilePhoto: profile.profilePhoto,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// POST - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, name, profilePhoto } = body

    if (!walletAddress || !name) {
      return NextResponse.json(
        { error: 'Wallet address and name are required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection(UserProfileCollection)

    const existingProfile = await collection.findOne({ walletAddress })

    if (existingProfile) {
      // Update existing profile
      await collection.updateOne(
        { walletAddress },
        {
          $set: {
            name,
            ...(profilePhoto !== undefined && { profilePhoto }),
            updatedAt: new Date(),
          },
        }
      )
    } else {
      // Create new profile
      await collection.insertOne({
        walletAddress,
        name,
        profilePhoto: profilePhoto || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Delete from all collections
    await Promise.all([
      db.collection(UserProfileCollection).deleteMany({ walletAddress }),
      db.collection('audits').deleteMany({ userId: walletAddress }),
      db.collection('deployments').deleteMany({ userAddress: walletAddress }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}