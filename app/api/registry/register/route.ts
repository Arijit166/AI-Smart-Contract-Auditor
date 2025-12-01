import { NextRequest, NextResponse } from 'next/server'
import { registerAuditOnChain } from '@/lib/services/registry-service'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      auditId,
      network,
      contractCode,
      fixedCode,
      llmOutput,
      auditorAddress,
      riskScore,
      autoFixApplied,
      vulnerabilities,
      ipfsReportCID,
      ipfsFixedCodeCID
    } = body

    // Register on blockchain
    try {
    const result = await registerAuditOnChain(network, {
        auditId,
        contractCode,
        fixedCode,
        llmOutput,
        auditorAddress,
        riskScore,
        autoFixApplied,
        vulnerabilities,
        ipfsReportCID,
        ipfsFixedCodeCID
    })

    if (!result || !result.success) {
        console.warn('⚠️ Registry registration failed (non-critical):', result?.error)
        return NextResponse.json({ 
        success: true, 
        warning: 'Audit saved but registry registration failed',
        error: result?.error 
        })
    }

    // Update database with registry info
   const db = await getDatabase()

    // First, try to find existing audit by userAddress and contract code
    const existingAudit = await db.collection(AuditCollection).findOne({
      userId: auditorAddress,
      contractCode: contractCode,
      network: network
    })

    if (existingAudit) {
      // Update existing audit
      await db.collection(AuditCollection).updateOne(
        { _id: existingAudit._id },
        {
          $set: {
            registryTxHash: result.transactionHash,
            contractHash: result.contractHash,
            auditIdHash: result.auditIdHash,
            registeredOnChain: true,
            registryNetwork: network,
            onChainPublished: true,
            onChainTxHash: result.transactionHash,
            vulnerabilities: vulnerabilities.map((v: any) => ({
              id: v.id || 0,
              severity: v.severity,
              title: v.title,
              line: v.line || 0,
              description: v.description,
              impact: v.impact || '',
              recommendation: v.recommendation || '',
              fixed: v.fixed || false
            }))
          }
        }
      )
    } else {
      // Create new audit record if it doesn't exist
      await db.collection(AuditCollection).insertOne({
        _id: auditId,
        userId: auditorAddress,
        network: network,
        contractName: 'DeployedContract',
        contractCode: contractCode,
        riskScore: riskScore,
        vulnerabilities: vulnerabilities.map((v: any) => ({
          id: v.id || 0,
          severity: v.severity,
          title: v.title,
          line: v.line || 0,
          description: v.description,
          impact: v.impact || '',
          recommendation: v.recommendation || '',
          fixed: v.fixed || false
        })),
        suggestions: [],
        fixedCode: fixedCode,
        status: 'completed',
        registryTxHash: result.transactionHash,
        contractHash: result.contractHash,
        auditIdHash: result.auditIdHash,
        registeredOnChain: true,
        registryNetwork: network,
        onChainPublished: true,
        onChainTxHash: result.transactionHash,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
        success: true,
        transactionHash: result.transactionHash,
        contractHash: result.contractHash
    })
    } catch (error: any) {
    console.error('Registry registration failed:', error)
    return NextResponse.json({ 
        success: true, 
        warning: 'Audit saved but registry registration failed',
        error: error.message 
    })
    }
  } catch (error: any) {
    console.error('Registry API error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}