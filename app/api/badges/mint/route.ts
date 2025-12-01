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

    // Check if user already has this exact badge
    const db = await getDatabase()
    const existingBadge = await db.collection(BadgeCollection).findOne({
      userId: userAddress.toLowerCase(),
      badgeType,
      tier,
      network,
      isCurrent: true
    })

    if (existingBadge) {
      return NextResponse.json({ 
        success: false, 
        error: `You already have ${badgeType} ${level}` 
      }, { status: 400 })
    }

    // Mint NFT on-chain with increased timeout for Celo
    const timeoutMs = network === 'celo-sepolia' ? 30000 : 20000
    
    const mintPromise = mintBadgeNFT({
      userAddress,
      badgeType,
      tier,
      level,
      network,
      auditId,
      metrics,
      reputation
    })

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Minting timeout - transaction may still be pending')), timeoutMs)
    )

    const mintResult = await Promise.race([mintPromise, timeoutPromise]) as any

    if (!mintResult.success) {
      return NextResponse.json({ success: false, error: mintResult.error }, { status: 500 })
    }

    // Save to database
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
    
    // Better error message for timeout
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Network timeout - please try again or switch to a different network' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}