import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    const userAddress = searchParams.get('userAddress')

    if (!auditId || !userAddress) {
      return NextResponse.json(
        { error: 'auditId and userAddress required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection(AuditCollection)

    const audit = await collection.findOne({
      _id: new ObjectId(auditId),
      userId: userAddress
    })

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      audit: {
        vulnerabilities: audit.vulnerabilities,
        suggestions: audit.suggestions,
        fixedCode: audit.fixedCode,
        contractName: audit.contractName,
        riskScore: audit.riskScore
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}