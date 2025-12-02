import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { buildAuditMerkleTree } from '@/lib/services/merkle-service'
import { ObjectId } from 'mongodb'  // Add this import

export async function POST(req: NextRequest) {
  try {
    const { auditId } = await req.json()
    
    if (!auditId) {
      return NextResponse.json({ success: false, error: 'Audit ID required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Convert string to ObjectId
    const audit = await db.collection('audits').findOne({ _id: new ObjectId(auditId) })
    
    if (!audit) {
      return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 })
    }

    const merkleData = buildAuditMerkleTree({
      vulnerabilities: audit.vulnerabilities || [],
      fixes: audit.fixedCode ? [{ code: audit.fixedCode }] : [],
      llmOutput: JSON.stringify(audit),
      pdfReportCID: audit.ipfsMetadataCID || ''
    })

    await db.collection('audits').updateOne(
      { _id: new ObjectId(auditId) },  // Convert here too
      {
        $set: {
          merkleRoot: merkleData.root,
          merkleLeaves: merkleData.leaves,
          merkleProofs: merkleData.proofs,
          merkleGeneratedAt: new Date()
        }
      }
    )

    return NextResponse.json({
      success: true,
      merkleRoot: merkleData.root,
      leaves: merkleData.leaves,
      proofs: merkleData.proofs
    })
  } catch (error: any) {
    console.error('Merkle generation error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}