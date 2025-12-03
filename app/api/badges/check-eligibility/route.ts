import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'
import { BadgeCollection } from '@/lib/models/Badge'
import { ethers } from 'ethers'

const REPUTATION_ABI = [
  "function getUserStats(address user) view returns (uint256 totalReputation, uint256 audits, uint256 deployments, uint256 fixes, uint256 penaltyCount)"
]

const NETWORKS: Record<string, { rpc: string, contractAddress: string, timeout: number }> = {
  'polygon-amoy': {
    rpc: 'https://rpc-amoy.polygon.technology',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_POLYGON_AMOY || '',
    timeout: 10000
  },
  'flow-testnet': {
    rpc: 'https://testnet.evm.nodes.onflow.org',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_FLOW_TESTNET || '',
    timeout: 10000
  },
  'celo-sepolia': {
    rpc: 'https://forno.celo-sepolia.celo-testnet.org/',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_CELO_SEPOLIA || '',
    timeout: 15000
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, network } = await request.json()

    if (!userAddress) {
      return NextResponse.json({ success: false, error: 'User address required' }, { status: 400 })
    }

    const db = await getDatabase()
    const audits = await db.collection(AuditCollection)
      .find({ 
        userId: userAddress.toLowerCase(),
        network: network
      })
      .toArray()

    const currentBadges = await db.collection(BadgeCollection)
      .find({ 
        userId: userAddress.toLowerCase(), 
        network: network, 
        isCurrent: true 
      })
      .toArray()

    const metrics = {
      totalAudits: audits.length,
      totalVulnerabilities: audits.reduce((sum, a) => sum + (a.vulnerabilities?.length || 0), 0),
      totalFixes: audits.filter(a => a.fixedCode).length,
      perfectScores: audits.filter(a => a.riskScore === 0).length,
      criticalVulns: audits.reduce((sum, a) => 
        sum + (a.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0), 0),
      highVulns: audits.reduce((sum, a) => 
        sum + (a.vulnerabilities?.filter((v: any) => v.severity === 'high').length || 0), 0),
    }

    let reputation = 0
    try {
      const networkConfig = NETWORKS[network]
      if (networkConfig?.contractAddress && ethers.isAddress(userAddress)) {
        const provider = new ethers.JsonRpcProvider(networkConfig.rpc, undefined, {
          staticNetwork: true,
          batchMaxCount: 1,
        })
        
        const contract = new ethers.Contract(
          networkConfig.contractAddress,
          REPUTATION_ABI,
          provider
        )

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), networkConfig.timeout)
        )
        
        const statsPromise = contract.getUserStats(userAddress)
        const stats = await Promise.race([statsPromise, timeoutPromise]) as any
        
        reputation = parseInt(stats.totalReputation.toString())
      }
    } catch (err) {
      console.error('Failed to fetch on-chain reputation:', err)
    }

    const eligibleBadges = []

    // Vulnerability Hunter
    const vulnTier = getVulnerabilityHunterTier(metrics)
    if (vulnTier > 0) {
      const currentVulnBadge = currentBadges.find(b => b.badgeType === 'Vulnerability Hunter')
      const currentTier = currentVulnBadge?.tier || 0
      
      if (vulnTier > currentTier) {
        const allVulnBadges = await db.collection(BadgeCollection)
          .find({ 
            userId: userAddress.toLowerCase(), 
            network: network,
            badgeType: 'Vulnerability Hunter',
            tier: vulnTier
          })
          .toArray()
        
        if (allVulnBadges.length === 0) {
          eligibleBadges.push({
            badgeType: 'Vulnerability Hunter',
            tier: vulnTier,
            level: getTierLevel(vulnTier),
            reason: `Found ${metrics.totalVulnerabilities} vulnerabilities (${metrics.criticalVulns} critical, ${metrics.highVulns} high)`
          })
        }
      }
    }

    // Security Expert
    const securityTier = getSecurityExpertTier(metrics)
    if (securityTier > 0) {
      const currentSecurityBadge = currentBadges.find(b => b.badgeType === 'Security Expert')
      const currentTier = currentSecurityBadge?.tier || 0
      
      if (securityTier > currentTier) {
        const allSecurityBadges = await db.collection(BadgeCollection)
          .find({ 
            userId: userAddress.toLowerCase(), 
            network: network,
            badgeType: 'Security Expert',
            tier: securityTier
          })
          .toArray()
        
        if (allSecurityBadges.length === 0) {
          eligibleBadges.push({
            badgeType: 'Security Expert',
            tier: securityTier,
            level: getTierLevel(securityTier),
            reason: `Fixed ${metrics.totalFixes} issues (${metrics.criticalVulns} critical, ${metrics.highVulns} high)`
          })
        }
      }
    }

    // Bug Fixer
    const bugFixerTier = getBugFixerTier(metrics)
    if (bugFixerTier > 0) {
      const currentBugFixerBadge = currentBadges.find(b => b.badgeType === 'Bug Fixer')
      const currentTier = currentBugFixerBadge?.tier || 0
      
      if (bugFixerTier > currentTier) {
        const allBugFixerBadges = await db.collection(BadgeCollection)
          .find({ 
            userId: userAddress.toLowerCase(), 
            network: network,
            badgeType: 'Bug Fixer',
            tier: bugFixerTier
          })
          .toArray()
        
        if (allBugFixerBadges.length === 0) {
          eligibleBadges.push({
            badgeType: 'Bug Fixer',
            tier: bugFixerTier,
            level: getTierLevel(bugFixerTier),
            reason: `Completed ${metrics.totalAudits} audits`
          })
        }
      }
    }

    // Verified Auditor
    const verifiedTier = getVerifiedAuditorTier(reputation)
    if (verifiedTier > 0) {
      const currentVerifiedBadge = currentBadges.find(b => b.badgeType === 'Verified Auditor')
      const currentTier = currentVerifiedBadge?.tier || 0
      
      if (verifiedTier > currentTier) {
        const allVerifiedBadges = await db.collection(BadgeCollection)
          .find({ 
            userId: userAddress.toLowerCase(), 
            network: network,
            badgeType: 'Verified Auditor',
            tier: verifiedTier
          })
          .toArray()
        
        if (allVerifiedBadges.length === 0) {
          eligibleBadges.push({
            badgeType: 'Verified Auditor',
            tier: verifiedTier,
            level: getTierLevel(verifiedTier),
            reason: `Reached ${reputation} reputation points`
          })
        }
      }
    }

    // Perfect Score
    const perfectTier = getPerfectScoreTier(metrics)
    if (perfectTier > 0) {
      const currentPerfectBadge = currentBadges.find(b => b.badgeType === 'Perfect Score')
      const currentTier = currentPerfectBadge?.tier || 0
      
      if (perfectTier > currentTier) {
        const allPerfectBadges = await db.collection(BadgeCollection)
          .find({ 
            userId: userAddress.toLowerCase(), 
            network: network,
            badgeType: 'Perfect Score',
            tier: perfectTier
          })
          .toArray()
        
        if (allPerfectBadges.length === 0) {
          eligibleBadges.push({
            badgeType: 'Perfect Score',
            tier: perfectTier,
            level: getTierLevel(perfectTier),
            reason: `Achieved ${metrics.perfectScores} perfect scores`
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
      reputation,
      eligibleBadges,
      currentBadges: currentBadges
    })
  } catch (error: any) {
    console.error('Check eligibility error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function getVulnerabilityHunterTier(metrics: any): number {
  const total = metrics.totalVulnerabilities
  const high = metrics.highVulns
  const critical = metrics.criticalVulns
  
  if (total >= 100 && critical >= 10 && high >= 30) return 5
  if (total >= 50 && critical >= 5 && high >= 15) return 4
  if (total >= 30 && high >= 10) return 3
  if (total >= 15 && high >= 5) return 2
  if (total >= 5) return 1
  
  return 0
}

function getSecurityExpertTier(metrics: any): number {
  const fixes = metrics.totalFixes
  const critical = metrics.criticalVulns
  const high = metrics.highVulns
  
  // Stricter: must have significant fixes AND vulnerabilities found
  if (fixes >= 100 && critical >= 30 && high >= 70) return 5
  if (fixes >= 50 && critical >= 15 && high >= 35) return 4
  if (fixes >= 30 && critical >= 10 && high >= 20) return 3
  if (fixes >= 20 && critical >= 6 && high >= 12) return 2
  if (fixes >= 10 && critical >= 3 && high >= 6) return 1
  
  return 0
}

function getBugFixerTier(metrics: any): number {
  const audits = metrics.totalAudits
  const fixes = metrics.totalFixes
  
  // Requires completing audits WITH fixes applied
  if (audits >= 120 && fixes >= 100) return 5
  if (audits >= 60 && fixes >= 50) return 4
  if (audits >= 30 && fixes >= 25) return 3
  if (audits >= 20 && fixes >= 15) return 2
  if (audits >= 10 && fixes >= 8) return 1
  return 0
}

function getVerifiedAuditorTier(reputation: number): number {
  if (reputation >= 15000) return 5
  if (reputation >= 5000) return 4
  if (reputation >= 1500) return 3
  if (reputation >= 500) return 2
  if (reputation >= 100) return 1
  return 0
}

function getPerfectScoreTier(metrics: any): number {
  const perfect = metrics.perfectScores
  if (perfect >= 100) return 5
  if (perfect >= 50) return 4
  if (perfect >= 25) return 3
  if (perfect >= 10) return 2
  if (perfect >= 3) return 1
  return 0
}

function getTierLevel(tier: number): string {
  const levels = ['', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond']
  return levels[tier] || ''
}