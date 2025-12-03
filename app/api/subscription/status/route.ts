import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { SubscriptionCollection } from '@/lib/models/Subscription'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('address')
    const network = searchParams.get('network')

    if (!userAddress || !network) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    const db = await getDatabase()
    const subscription = await db.collection(SubscriptionCollection).findOne({
      userAddress: userAddress.toLowerCase(),
      network,
      expiry: { $gt: new Date() }
    })

    if (!subscription) {
      return NextResponse.json({
        success: true,
        hasSubscription: false,
        tier: 'NONE'
      })
    }

    return NextResponse.json({
      success: true,
      hasSubscription: true,
      subscription: {
        tier: subscription.tier,
        expiry: subscription.expiry,
        active: subscription.expiry > new Date()
      }
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}