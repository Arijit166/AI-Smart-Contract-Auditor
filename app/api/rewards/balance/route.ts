import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { getAuditorStats } from '@/lib/services/reward-service'

const TOKEN_ABI = ["function balanceOf(address) view returns (uint256)"]

const NETWORKS: Record<string, { rpc: string, tokenAddress: string }> = {
  'polygon-amoy': {
    rpc: 'https://rpc-amoy.polygon.technology',
    tokenAddress: process.env.NEXT_PUBLIC_AUDIT_TOKEN_POLYGON_AMOY || ''
  },
  'flow-testnet': {
    rpc: 'https://testnet.evm.nodes.onflow.org',
    tokenAddress: process.env.NEXT_PUBLIC_AUDIT_TOKEN_FLOW_TESTNET || ''
  },
  'celo-sepolia': {
    rpc: 'https://forno.celo-sepolia.celo-testnet.org/',
    tokenAddress: process.env.NEXT_PUBLIC_AUDIT_TOKEN_CELO_SEPOLIA || ''
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')
    const network = searchParams.get('network')

    if (!address || !network) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      )
    }

    const networkConfig = NETWORKS[network]
    if (!networkConfig?.tokenAddress) {
      return NextResponse.json({
        success: true,
        balance: '0',
        totalRewards: '0'
      })
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpc)
    const tokenContract = new ethers.Contract(
      networkConfig.tokenAddress,
      TOKEN_ABI,
      provider
    )

    const balance = await tokenContract.balanceOf(address)
    const stats = await getAuditorStats(address, network)

    return NextResponse.json({
      success: true,
      balance: ethers.formatEther(balance),
      totalRewards: stats.totalRewards,
      auditCount: stats.auditCount
    })
  } catch (error: any) {
    console.error('Balance check error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}