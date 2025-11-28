import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { DeploymentCollection } from '@/lib/models/Deployment'

export async function POST(request: NextRequest) {
  try {
    console.log('🔵 [API] POST /api/deploy - Request received')

    let body
    try {
      body = await request.json()
    } catch (err: any) {
      console.error('❌ [API] Invalid JSON:', err.message)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { contractCode, network, userAddress, contractAddress, transactionHash, gasUsed } = body

    console.log('📦 [API] Body received:', {
      contractCode: contractCode ? `${contractCode.length} chars` : 'missing',
      network,
      userAddress,
      contractAddress,
      transactionHash: transactionHash?.substring(0, 20) + '...',
    })

    // Validation
    if (!contractCode?.trim()) {
      console.log('❌ [API] Empty contract code')
      return NextResponse.json(
        { error: 'Contract code is required' },
        { status: 400 }
      )
    }

    if (!network) {
      console.log('❌ [API] Missing network')
      return NextResponse.json(
        { error: 'Network is required' },
        { status: 400 }
      )
    }

    if (!userAddress) {
      console.log('❌ [API] Missing userAddress')
      return NextResponse.json(
        { error: 'User address is required' },
        { status: 400 }
      )
    }

    if (!contractAddress) {
      console.log('❌ [API] Missing contractAddress')
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      )
    }

    if (!transactionHash) {
      console.log('❌ [API] Missing transactionHash')
      return NextResponse.json(
        { error: 'Transaction hash is required' },
        { status: 400 }
      )
    }

    const validNetworks = ['polygon-amoy', 'flow-testnet', 'celo-sepolia']
    if (!validNetworks.includes(network)) {
      console.log('❌ [API] Invalid network:', network)
      return NextResponse.json(
        { error: `Invalid network. Must be one of: ${validNetworks.join(', ')}` },
        { status: 400 }
      )
    }

    // Save deployment to database
    console.log('🟡 [API] Saving deployment to MongoDB...')
    try {
      const db = await getDatabase()
      const collection = db.collection(DeploymentCollection)

      const deployment = {
        userAddress,
        contractName: 'SmartContract',
        contractCode,
        network,
        contractAddress,
        deploymentHash: transactionHash,
        gasUsed: gasUsed || '0',
        status: 'success',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await collection.insertOne(deployment)
      console.log('✅ [API] Saved to MongoDB:', result.insertedId.toString())

      return NextResponse.json({
        success: true,
        message: 'Deployment saved successfully',
        deploymentId: result.insertedId,
      })
    } catch (dbErr: any) {
      console.error('❌ [API] MongoDB save failed:', dbErr.message)
      return NextResponse.json(
        { error: 'Failed to save deployment to database', details: dbErr.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ [API] Unexpected error:', error.message)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}