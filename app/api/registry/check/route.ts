import { NextRequest, NextResponse } from 'next/server'
import { checkContractAudited } from '@/lib/services/registry-service'

export async function POST(req: NextRequest) {
  try {
    const { network, contractCode } = await req.json()

    const result = await checkContractAudited(network, contractCode)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Check registry error:', error)
    return NextResponse.json({ audited: false, error: error.message }, { status: 500 })
  }
}