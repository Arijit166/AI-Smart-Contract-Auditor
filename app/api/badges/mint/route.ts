import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { BadgeCollection } from '@/lib/models/Badge'
import { mintBadgeNFT } from '@/lib/services/badge-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userAddress, badgeType, tier, level, network, auditId, metrics, reputation } = body

    if (!userAddress || !badgeType || !tier || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Mint NFT on-chain
    const mintResult = await mintBadgeNFT({
      userAddress,
      badgeType,
      tier,
      level,
      network,
      auditId,
      metrics,
      reputation
    })

    if (!mintResult.success) {
      return NextResponse.json({ success: false, error: mintResult.error }, { status: 500 })
    }

    // Save to database
    const db = await getDatabase()
    
    // Mark old badge as superseded if exists
    await db.collection(BadgeCollection).updateMany(
      { userId: userAddress.toLowerCase(), badgeType, network, isCurrent: true },
      { $set: { isCurrent: false, supersededBy: mintResult.tokenId } }
    )

    // Insert new badge
    await db.collection(BadgeCollection).insertOne({
      userId: userAddress.toLowerCase(),
      badgeType,
      level,
      tier,
      network,
      tokenId: mintResult.tokenId!,
      auditId: auditId || null,
      auditHash: mintResult.auditHash!,
      fixedCodeHash: mintResult.fixedCodeHash || null,
      reputationSnapshot: reputation,
      metricsSnapshot: metrics,
      ipfsMetadataCID: mintResult.ipfsMetadataCID!,
      transactionHash: mintResult.transactionHash!,
      isCurrent: true,
      isSoulbound: true,
      mintedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      tokenId: mintResult.tokenId,
      transactionHash: mintResult.transactionHash,
      ipfsMetadataCID: mintResult.ipfsMetadataCID
    })
  } catch (error: any) {
    console.error('Mint badge error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}