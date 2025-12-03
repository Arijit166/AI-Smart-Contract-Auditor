import { NextRequest, NextResponse } from 'next/server'
import { sendAuditReward } from '@/lib/services/reward-service'

export async function POST(request: NextRequest) {
  try {
    const { auditorAddress, amount, network, reason } = await request.json()

    if (!auditorAddress || !amount || !network) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendAuditReward(auditorAddress, amount, network)

    if (result.success) {
      console.log(`✅ Rewarded ${auditorAddress}: ${amount} AUDIT (${reason})`)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Reward distribution error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}