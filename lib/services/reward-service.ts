import { ethers } from 'ethers'

const AUDIT_TOKEN_ABI = [
  "function rewardAuditor(address auditor, uint256 amount) external",
  "function auditorRewards(address) view returns (uint256)",
  "function getAuditorStats(address auditor) view returns (uint256 totalRewards, uint256 auditCount)"
]

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

export async function sendAuditReward(auditorAddress: string, amount: number, network: string) {
  try {
    const networkConfig = NETWORKS[network]
    if (!networkConfig?.tokenAddress) {
      throw new Error('Network not configured')
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpc)
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider)
    
    const tokenContract = new ethers.Contract(
      networkConfig.tokenAddress,
      AUDIT_TOKEN_ABI,
      wallet
    )

    const rewardAmount = ethers.parseEther(amount.toString())
    const tx = await tokenContract.rewardAuditor(auditorAddress, rewardAmount)
    const receipt = await tx.wait()

    return {
      success: true,
      transactionHash: receipt.hash,
      amount: amount
    }
  } catch (error: any) {
    console.error('Reward distribution failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function getAuditorStats(auditorAddress: string, network: string) {
  try {
    const networkConfig = NETWORKS[network]
    if (!networkConfig?.tokenAddress) {
      return { totalRewards: '0', auditCount: '0' }
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpc)
    const tokenContract = new ethers.Contract(
      networkConfig.tokenAddress,
      AUDIT_TOKEN_ABI,
      provider
    )

    const stats = await tokenContract.getAuditorStats(auditorAddress)
    
    return {
      totalRewards: ethers.formatEther(stats.totalRewards),
      auditCount: stats.auditCount.toString()
    }
  } catch (error) {
    console.error('Failed to fetch auditor stats:', error)
    return { totalRewards: '0', auditCount: '0' }
  }
}