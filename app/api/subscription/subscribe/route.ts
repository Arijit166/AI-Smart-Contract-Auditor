import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { SubscriptionCollection } from '@/lib/models/Subscription'
import { ethers } from 'ethers'

export async function POST(request: NextRequest) {
  try {
    const { userAddress, tier, network, transactionHash } = await request.json()
    
    if (!userAddress || !tier || !network || !transactionHash) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Verify transaction on-chain
    const networkConfigs: Record<string, string> = {
      'polygon-amoy': 'https://rpc-amoy.polygon.technology',
      'flow-testnet': 'https://testnet.evm.nodes.onflow.org',
      'celo-sepolia': 'https://forno.celo-sepolia.celo-testnet.org/'
    }

    const rpcUrl = networkConfigs[network]
    if (!rpcUrl) {
      return NextResponse.json({ success: false, error: 'Invalid network' }, { status: 400 })
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    
    try {
      const receipt = await provider.getTransactionReceipt(transactionHash)
      
      if (!receipt) {
        return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 400 })
      }
      
      if (receipt.status !== 1) {
        return NextResponse.json({ success: false, error: 'Transaction failed on-chain' }, { status: 400 })
      }
    } catch (txError) {
      console.error('Transaction verification error:', txError)
      return NextResponse.json({ success: false, error: 'Failed to verify transaction' }, { status: 400 })
    }

    // Calculate expiry (30 days from now)
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)

    const db = await getDatabase()
    
    // Check if user already has an active subscription for this network
    const existingSubscription = await db.collection(SubscriptionCollection).findOne({
      userAddress: userAddress.toLowerCase(),
      network,
      expiry: { $gt: new Date() }
    })

    if (existingSubscription) {
      // Update existing subscription
      await db.collection(SubscriptionCollection).updateOne(
        { _id: existingSubscription._id },
        {
          $set: {
            tier,
            expiry,
            transactionHash,
            updatedAt: new Date()
          }
        }
      )
    } else {
      // Create new subscription
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
    }

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
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}