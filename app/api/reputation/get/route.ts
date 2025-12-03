import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

const REPUTATION_ABI = [
  "function getReputation(address user) view returns (uint256)",
  "function getUserStats(address user) view returns (uint256 totalReputation, uint256 audits, uint256 deployments, uint256 fixes, uint256 penaltyCount)",
  "function getTopUsers(uint256 limit) view returns (address[] users, uint256[] scores)",
  "function getTotalParticipants() view returns (uint256)"
]

// ✅ FIX: Use reliable RPC URLs
const NETWORKS: Record<string, { rpc: string, contractAddress: string }> = {
  'polygon-amoy': {
    rpc: 'https://rpc-amoy.polygon.technology', // Official Polygon RPC
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_POLYGON_AMOY || ''
  },
  'flow-testnet': {
    rpc: 'https://testnet.evm.nodes.onflow.org',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_FLOW_TESTNET || ''
  },
  'celo-sepolia': {
    rpc: 'https://forno.celo-sepolia.celo-testnet.org/',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_CELO_SEPOLIA || ''
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const leaderboard = searchParams.get('leaderboard')
    const network = searchParams.get('network') || 'polygon-amoy'

    const networkConfig = NETWORKS[network]
    if (!networkConfig || !networkConfig.contractAddress) {
      return NextResponse.json(
        { success: false, error: `Network ${network} not configured` },
        { status: 400 }
      )
    }

    // ✅ FIX: Add connection options for better reliability
    const provider = new ethers.JsonRpcProvider(networkConfig.rpc, undefined, {
      staticNetwork: true, // Don't auto-detect network
      batchMaxCount: 1 // Don't batch requests
    })
    
    const contract = new ethers.Contract(
      networkConfig.contractAddress,
      REPUTATION_ABI,
      provider
    )

    // Get leaderboard
    if (leaderboard === 'true') {
      const limit = parseInt(searchParams.get('limit') || '10')
      
      try {
        const [users, scores] = await contract.getTopUsers(limit)
        const totalParticipants = await contract.getTotalParticipants()

        const leaderboardData = users.map((user: string, index: number) => ({
          rank: index + 1,
          address: user,
          reputation: scores[index].toString()
        }))

        return NextResponse.json({
          success: true,
          leaderboard: leaderboardData,
          totalParticipants: totalParticipants.toString()
        })
      } catch (err: any) {
        console.error('Contract call error:', err.message)
        // Return empty leaderboard if contract call fails
        return NextResponse.json({
          success: true,
          leaderboard: [],
          totalParticipants: '0'
        })
      }
    }

    // Get user stats
    if (address && ethers.isAddress(address)) {
      try {
        const stats = await contract.getUserStats(address)
        
        return NextResponse.json({
          success: true,
          userStats: {
            address,
            totalReputation: stats.totalReputation.toString(),
            auditsCompleted: stats.audits.toString(),
            deploymentsCompleted: stats.deployments.toString(),
            fixesApplied: stats.fixes.toString(),
            penalties: stats.penaltyCount.toString()
          }
        })
      } catch (err: any) {
        console.error('Contract call error:', err.message)
        // Return zero stats if contract call fails
        return NextResponse.json({
          success: true,
          userStats: {
            address,
            totalReputation: '0',
            auditsCompleted: '0',
            deploymentsCompleted: '0',
            fixesApplied: '0',
            penalties: '0'
          }
        })
      }
    }

    return NextResponse.json(
      { success: false, error: 'No valid query provided' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('❌ [Reputation Get] Error:', error.message)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reputation' },
      { status: 500 }
    )
  }
}