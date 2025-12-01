import { ethers } from 'ethers'
import { ipfsService } from './ipfs'

const BADGE_NFT_CONTRACTS: Record<string, string> = {
  'polygon-amoy': process.env.NEXT_PUBLIC_BADGE_NFT_CONTRACT_POLYGON_AMOY || '',
  'flow-testnet': process.env.NEXT_PUBLIC_BADGE_NFT_CONTRACT_FLOW_TESTNET || '',
  'celo-sepolia': process.env.NEXT_PUBLIC_BADGE_NFT_CONTRACT_CELO_SEPOLIA || ''
}

const BADGE_NFT_ABI = [
  "function mintBadge(address to, string badgeType, string level, uint8 tier, bytes32 auditId, bytes32 auditHash, bytes32 fixedCodeHash, uint256 reputationSnapshot, tuple(uint256 totalAudits, uint256 totalVulnerabilities, uint256 totalFixes, uint256 perfectScores, uint256 criticalVulns, uint256 highVulns) metrics, string ipfsMetadataCID, bool isSoulbound) returns (uint256)",
  "function getUserBadges(address user) view returns (uint256[])",
  "function getBadgeMetadata(uint256 tokenId) view returns (tuple(string badgeType, string level, uint8 tier, uint256 timestamp, bytes32 auditId, bytes32 auditHash, bytes32 fixedCodeHash, address auditorAddress, uint256 reputationSnapshot, tuple(uint256 totalAudits, uint256 totalVulnerabilities, uint256 totalFixes, uint256 perfectScores, uint256 criticalVulns, uint256 highVulns) metricsSnapshot, string ipfsMetadataCID, uint256 supersededBy, bool isCurrent, bool isSoulbound))"
]

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
      'polygon-amoy': process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
      'flow-testnet': process.env.FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
      'celo-sepolia': process.env.CELO_SEPOLIA_RPC_URL || 'https://alfajores-forno.celo-testnet.org'
    }

    const provider = new ethers.JsonRpcProvider(rpcUrls[params.network])
    const signer = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(contractAddress, BADGE_NFT_ABI, signer)

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

    const receipt = await tx.wait()
    
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