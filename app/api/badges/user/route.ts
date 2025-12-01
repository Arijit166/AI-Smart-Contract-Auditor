import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { BadgeCollection } from '@/lib/models/Badge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.
    get('address')
    const network = searchParams.get('network')
    if (!userAddress) {
    return NextResponse.json({ success: false, error: 'Address required' }, { status: 400 })
    }

    const db = await getDatabase()

    const query: any = { userId: userAddress.toLowerCase() }
    if (network) query.network = network

    const badges = await db.collection(BadgeCollection)
    .find(query)
    .sort({ mintedAt: -1 })
    .toArray()

    const currentBadges = badges.filter(b => b.isCurrent)
    const supersededBadges = badges.filter(b => !b.isCurrent)

    return NextResponse.json({
    success: true,
    currentBadges,
    supersededBadges,
    totalBadges: badges.length
    })
  }catch (error: any) {
   console.error('Get user badges error:', error)
   return NextResponse.json({ success: false, error: error.message }, { status: 500 })
}
}