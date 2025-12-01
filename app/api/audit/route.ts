import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractCode, userAddress, auditResults, network } = body

    if (!contractCode || !userAddress || !auditResults || !network) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection(AuditCollection)

    // Check if audit for this exact contract code already exists for this user
    const existingAudit = await collection.findOne({
      userId: userAddress,
      contractCode: contractCode,
      network: network,
    })

    if (existingAudit) {
      // Update existing audit instead of creating duplicate
      const result = await collection.updateOne(
        { _id: existingAudit._id },
        {
          $set: {
            riskScore: auditResults.riskScore,
            vulnerabilities: auditResults.vulnerabilities || [],
            suggestions: auditResults.suggestions || [],
            fixedCode: auditResults.fixedCode,
            status: 'completed',
            updatedAt: new Date(),
          }
        }
      )

      return NextResponse.json({
        success: true,
        auditId: existingAudit._id.toString(),
        updated: true,
      })
    }

    // Create new audit if doesn't exist
    const audit = {
      userId: userAddress,
      network: network,
      contractName: extractContractName(contractCode) || 'UnnamedContract',
      contractCode,
      riskScore: auditResults.riskScore,
      vulnerabilities: auditResults.vulnerabilities || [],
      suggestions: auditResults.suggestions || [],
      fixedCode: auditResults.fixedCode,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await collection.insertOne(audit)

    return NextResponse.json({
      success: true,
      auditId: result.insertedId.toString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

function extractContractName(code: string): string | null {
  const match = code.match(/contract\s+(\w+)/)
  return match ? match[1] : null
}