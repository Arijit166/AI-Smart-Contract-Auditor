import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

// ABI for AuditReputation contract
const REPUTATION_ABI = [
  "function addAudit(address user) external",
  "function addDeployment(address user) external",
  "function addFix(address user) external",
  "function penalize(address user) external",
  "event ReputationUpdated(address indexed user, uint256 oldReputation, uint256 newReputation, string action)"
]

// Network configurations
const NETWORKS: Record<string, { rpc: string, contractAddress: string }> = {
  'polygon-amoy': {
    rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_POLYGON_AMOY || ''
  },
  'flow-testnet': {
    rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_FLOW_TESTNET || ''
  },
  'celo-sepolia': {
    rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_CELO_SEPOLIA || ''
  }
}

interface ReputationUpdateRequest {
  action: 'audit' | 'deployment' | 'fix' | 'penalty'
  userAddress: string
  network?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ReputationUpdateRequest = await request.json()
    const { action, userAddress, network = 'polygon-amoy' } = body

    // Validate inputs
    if (!action || !userAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing action or userAddress' },
        { status: 400 }
      )
    }

    if (!ethers.isAddress(userAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user address' },
        { status: 400 }
      )
    }

    // Get network config
    const networkConfig = NETWORKS[network]
    if (!networkConfig || !networkConfig.contractAddress) {
      return NextResponse.json(
        { success: false, error: `Network ${network} not configured` },
        { status: 400 }
      )
    }

    // Get backend wallet private key
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { success: false, error: 'Backend wallet not configured' },
        { status: 500 }
      )
    }

    // Setup provider and signer
    const provider = new ethers.JsonRpcProvider(networkConfig.rpc)
    const wallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(
      networkConfig.contractAddress,
      REPUTATION_ABI,
      wallet
    )

    console.log(`📊 [Reputation] Updating reputation for ${userAddress}: ${action}`)

    // Call appropriate contract function
    let tx
    switch (action) {
      case 'audit':
        tx = await contract.addAudit(userAddress)
        break
      case 'deployment':
        tx = await contract.addDeployment(userAddress)
        break
      case 'fix':
        tx = await contract.addFix(userAddress)
        break
      case 'penalty':
        tx = await contract.penalize(userAddress)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Wait for transaction confirmation
    const receipt = await tx.wait()
    console.log(`✅ [Reputation] Transaction confirmed: ${receipt.hash}`)

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      action,
      userAddress,
      network
    })

  } catch (error: any) {
    console.error('❌ [Reputation] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update reputation' },
      { status: 500 }
    )
  }
}