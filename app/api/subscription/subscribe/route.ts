import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { SubscriptionCollection } from '@/lib/models/Subscription'
import { ethers } from 'ethers'

export async function POST(request: NextRequest) {
  try {
    const { userAddress, tier, network, transactionHash } = await request.json()

    if (!userAddress || !tier || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Verify transaction on-chain
    const networkConfigs: Record<string, string> = {
      'polygon-amoy': 'https://rpc-amoy.polygon.technology',
      'flow-testnet': 'https://testnet.evm.nodes.onflow.org',
      'celo-sepolia': 'https://alfajores-forno.celo-testnet.org'
    }

    const provider = new ethers.JsonRpcProvider(networkConfigs[network])
    const receipt = await provider.getTransactionReceipt(transactionHash)

    if (!receipt || receipt.status !== 1) {
      return NextResponse.json({ success: false, error: 'Transaction failed or not found' }, { status: 400 })
    }

    // Calculate expiry (30 days from now)
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)

    const db = await getDatabase()
    const subscription = {
      userAddress: userAddress.toLowerCase(),
      tier,
      expiry,
      subscribedAt: new Date(),
      network,
      transactionHash,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await db.collection(SubscriptionCollection).insertOne(subscription)

    return NextResponse.json({
      success: true,
      subscription: {
        tier,
        expiry: expiry.toISOString(),
        active: true
      }
    })
  } catch (error: any) {
    console.error('Subscription error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}