import { ethers } from 'ethers'
import { ipfsService } from './ipfs'

const BADGE_NFT_CONTRACTS: Record<string, string> = {
  'polygon-amoy': process.env.NEXT_PUBLIC_BADGE_NFT_CONTRACT_POLYGON_AMOY || '',
  'flow-testnet': process.env.NEXT_PUBLIC_BADGE_NFT_CONTRACT_FLOW_TESTNET || '',
  'celo-sepolia': process.env.NEXT_PUBLIC_BADGE_NFT_CONTRACT_CELO_SEPOLIA || ''
}
const REPUTATION_ABI = [
  "function getUserStats(address user) view returns (uint256 totalReputation, uint256 audits, uint256 deployments, uint256 fixes, uint256 penaltyCount)"
]
const REPUTATION_CONTRACTS: Record<string, string> = {
  'polygon-amoy': process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_POLYGON_AMOY || '',
  'flow-testnet': process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_FLOW_TESTNET || '',
  'celo-sepolia': process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_CELO_SEPOLIA || ''
}
const BADGE_NFT_ABI = [
  "function mintBadge(address to, string badgeType, string level, uint8 tier, bytes32 auditId, bytes32 auditHash, bytes32 fixedCodeHash, uint256 reputationSnapshot, tuple(uint256 totalAudits, uint256 totalVulnerabilities, uint256 totalFixes, uint256 perfectScores, uint256 criticalVulns, uint256 highVulns) metrics, string ipfsMetadataCID, bool isSoulbound) returns (uint256)",
  "function getUserBadges(address user) view returns (uint256[])",
  "function getBadgeMetadata(uint256 tokenId) view returns (tuple(string badgeType, string level, uint8 tier, uint256 timestamp, bytes32 auditId, bytes32 auditHash, bytes32 fixedCodeHash, address auditorAddress, uint256 reputationSnapshot, tuple(uint256 totalAudits, uint256 totalVulnerabilities, uint256 totalFixes, uint256 perfectScores, uint256 criticalVulns, uint256 highVulns) metricsSnapshot, string ipfsMetadataCID, uint256 supersededBy, bool isCurrent, bool isSoulbound))"
]

function meetsOnChainCriteria(badgeType: string, tier: number, stats: any): boolean {
  switch (badgeType) {
    case 'Verified Auditor':
      const repRequirements = [0, 100, 500, 1500, 5000, 15000]
      return stats.reputation >= repRequirements[tier]
    
    case 'Bug Fixer':
      const auditRequirements = [0, 5, 15, 30, 60, 120]
      return stats.audits >= auditRequirements[tier]
    
    case 'Security Expert':
      // Contract checks EACH field separately: fixes, criticalVulns, highVulns
      const requirements = [
        { fixes: 0, critical: 0, high: 0 },
        { fixes: 3, critical: 1, high: 2 },  // Tier 1 - BOTH critical AND high required
        { fixes: 10, critical: 3, high: 7 },
        { fixes: 25, critical: 8, high: 17 },
        { fixes: 50, critical: 15, high: 35 },
        { fixes: 100, critical: 30, high: 70 }
      ]
      const req = requirements[tier]
      
      return stats.fixes >= req.fixes && 
             (stats.metrics.criticalVulns || 0) >= req.critical && 
             (stats.metrics.highVulns || 0) >= req.high  // Must check high separately!
    
    case 'Vulnerability Hunter':
      const vulnReqs = [
        { total: 0, high: 0 },
        { total: 5, high: 0 },
        { total: 15, high: 5 },
        { total: 30, high: 10 },
        { total: 50, high: 15 },
        { total: 100, high: 30 }
      ]
      const vReq = vulnReqs[tier]
      
      return (stats.metrics.totalVulnerabilities || 0) >= vReq.total && 
             (stats.metrics.highVulns || 0) >= vReq.high
    
    case 'Perfect Score':
      const perfectReqs = [0, 3, 10, 25, 50, 100]
      return (stats.metrics.perfectScores || 0) >= perfectReqs[tier]
    
    default:
      return true
  }
}

export async function mintBadgeNFT(params: {
  userAddress: string
  badgeType: string
  tier: number
  level: string
  network: string
  auditId?: string
  metrics: any
  reputation: number
}) {
  try {
    const contractAddress = BADGE_NFT_CONTRACTS[params.network]
    if (!contractAddress) {
      return { success: false, error: 'Badge contract not deployed on this network' }
    }

    // Generate hashes
    const auditIdHash = params.auditId 
      ? ethers.keccak256(ethers.toUtf8Bytes(params.auditId))
      : ethers.ZeroHash
    const auditHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(params.metrics)))
    const fixedCodeHash = ethers.ZeroHash // Update if fix code available

    // Create metadata JSON
    const metadata = {
      name: `${params.badgeType} - ${params.level}`,
      description: `Awarded for exceptional performance in smart contract auditing`,
      image: `ipfs://badge-images/${params.badgeType.toLowerCase().replace(/\s/g, '-')}-${params.tier}.png`,
      attributes: [
        { trait_type: 'Badge Type', value: params.badgeType },
        { trait_type: 'Level', value: params.level },
        { trait_type: 'Tier', value: params.tier },
        { trait_type: 'Total Audits', value: params.metrics.totalAudits },
        { trait_type: 'Vulnerabilities Found', value: params.metrics.totalVulnerabilities },
        { trait_type: 'Fixes Applied', value: params.metrics.totalFixes },
        { trait_type: 'Perfect Scores', value: params.metrics.perfectScores },
        { trait_type: 'Reputation at Mint', value: params.reputation },
        { trait_type: 'Mint Date', value: new Date().toISOString() }
      ],
      external_url: `https://yourplatform.com/badges/${params.userAddress}`,
      properties: {
        category: 'Achievement',
        soulbound: true
      }
    }

    // Pin metadata to IPFS
    const ipfsResult = await ipfsService.uploadJSON(metadata, 'badge-metadata.json')
    if (!ipfsResult.success) {
      return { success: false, error: 'Failed to upload metadata to IPFS' }
    }

    // Get private key from environment
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY
    if (!privateKey) {
      return { success: false, error: 'Deployer private key not configured' }
    }

    // Get RPC URL
    const rpcUrls: Record<string, string> = {
      'polygon-amoy': process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
      'flow-testnet': process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
      'celo-sepolia': process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
    }

    const provider = new ethers.JsonRpcProvider(rpcUrls[params.network])
    const signer = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(contractAddress, BADGE_NFT_ABI, signer)
    
    const reputationAddress = REPUTATION_CONTRACTS[params.network]
        if (!reputationAddress) {
        return { success: false, error: 'Reputation contract not found for network' }
        }

        const reputationContract = new ethers.Contract(reputationAddress, REPUTATION_ABI, provider)
        const onChainStats = await reputationContract.getUserStats(params.userAddress)
        
        const onChainReputation = Number(onChainStats.totalReputation)
        const onChainAudits = Number(onChainStats.audits)
        const onChainFixes = Number(onChainStats.fixes)

        // Log for debugging
        console.log('On-chain stats:', {
        reputation: onChainReputation,
        audits: onChainAudits,
        fixes: onChainFixes
        })
        console.log('Attempting to mint:', {
        badgeType: params.badgeType,
        tier: params.tier,
        offChainMetrics: params.metrics,
        offChainReputation: params.reputation
        })

        // Validate against contract's requirements
        if (!meetsOnChainCriteria(params.badgeType, params.tier, {
            reputation: onChainReputation,
            audits: onChainAudits,
            fixes: onChainFixes,
            metrics: params.metrics
            })) {
            // Build detailed error message
            let errorMsg = `Badge criteria not met. `
            
            if (params.badgeType === 'Security Expert') {
                const reqs = [
                { fixes: 0, critical: 0, high: 0 },
                { fixes: 3, critical: 1, high: 2 },
                { fixes: 10, critical: 3, high: 7 },
                { fixes: 25, critical: 8, high: 17 },
                { fixes: 50, critical: 15, high: 35 },
                { fixes: 100, critical: 30, high: 70 }
                ]
                const req = reqs[params.tier]
                errorMsg += `For ${params.badgeType} Tier ${params.tier}, you need: ${req.fixes} fixes (you have ${onChainFixes}), ${req.critical} critical vulns (you have ${params.metrics.criticalVulns}), ${req.high} high vulns (you have ${params.metrics.highVulns}).`
            }
            
            return { 
                success: false, 
                error: errorMsg
            }
            }

    // Mint badge
    const tx = await contract.mintBadge(
      params.userAddress,
      params.badgeType,
      params.level,
      params.tier,
      auditIdHash,
      auditHash,
      fixedCodeHash,
      params.reputation,
      [
        params.metrics.totalAudits,
        params.metrics.totalVulnerabilities,
        params.metrics.totalFixes,
        params.metrics.perfectScores,
        params.metrics.criticalVulns || 0,
        params.metrics.highVulns || 0
      ],
      ipfsResult.cid,
      true 
    )

    const receipt = await tx.wait(1)
    
    // Extract tokenId from event
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === 'BadgeMinted'
      } catch {
        return false
      }
    })

    let tokenId = '0'
    if (event) {
      const parsed = contract.interface.parseLog(event)
      tokenId = parsed?.args[0].toString()
    }

    return {
      success: true,
      tokenId,
      transactionHash: receipt.hash,
      ipfsMetadataCID: ipfsResult.cid,
      auditHash,
      fixedCodeHash
    }
  } catch (error: any) {
    console.error('Mint badge NFT error:', error)
    return { success: false, error: error.message }
  }
}