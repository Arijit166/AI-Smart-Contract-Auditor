import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const network = searchParams.get('network')

    if (!address || !network) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Get audits from current month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const count = await db.collection(AuditCollection).countDocuments({
      userId: address.toLowerCase(),
      network,
      createdAt: { $gte: startOfMonth }
    })

    return NextResponse.json({
      success: true,
      count,
      startOfMonth: startOfMonth.toISOString()
    })
  } catch (error: any) {
    console.error('Audit count error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}