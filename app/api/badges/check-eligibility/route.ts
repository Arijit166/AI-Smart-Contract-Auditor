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
    rpc: 'https://alfajores-forno.celo-testnet.org',
    contractAddress: process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_CELO_SEPOLIA || '',
    timeout: 15000 // Longer timeout for Celo
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userAddress, network } = await request.json()

    if (!userAddress) {
      return NextResponse.json({ success: false, error: 'User address required' }, { status: 400 })
    }

    const db = await getDatabase()

    // Get user's audit stats from database
    const audits = await db.collection(AuditCollection)
      .find({ 
        userId: userAddress.toLowerCase(),
        network: network
      })
      .toArray()

    // Get user's CURRENT badges (not superseded ones)
    const currentBadges = await db.collection(BadgeCollection)
      .find({ 
        userId: userAddress.toLowerCase(), 
        network: network, 
        isCurrent: true 
      })
      .toArray()

    // Calculate metrics from audits
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

    // Fetch on-chain reputation with timeout
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

        // Set timeout for contract call
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), networkConfig.timeout)
        )
        
        const statsPromise = contract.getUserStats(userAddress)
        const stats = await Promise.race([statsPromise, timeoutPromise]) as any
        
        reputation = parseInt(stats.totalReputation.toString())
      }
    } catch (err) {
      console.error('Failed to fetch on-chain reputation:', err)
      // Continue with reputation = 0 if fetch fails
    }

    // Check eligibility for each badge type
    const eligibleBadges = []

    // Vulnerability Hunter - FIXED TIER LOGIC
    const vulnTier = getVulnerabilityHunterTier(metrics)
    if (vulnTier > 0) {
      const currentVulnBadge = currentBadges.find(b => b.badgeType === 'Vulnerability Hunter')
      const currentTier = currentVulnBadge?.tier || 0
      
      // Only show if user can upgrade to a HIGHER tier
      if (vulnTier > currentTier) {
        eligibleBadges.push({
          badgeType: 'Vulnerability Hunter',
          tier: vulnTier,
          level: getTierLevel(vulnTier),
          reason: `Found ${metrics.totalVulnerabilities} vulnerabilities (${metrics.criticalVulns} critical, ${metrics.highVulns} high)`
        })
      }
    }

    // Security Expert - FIXED TIER LOGIC
    const securityTier = getSecurityExpertTier(metrics)
    if (securityTier > 0) {
      const currentSecurityBadge = currentBadges.find(b => b.badgeType === 'Security Expert')
      const currentTier = currentSecurityBadge?.tier || 0
      
      if (securityTier > currentTier) {
        eligibleBadges.push({
          badgeType: 'Security Expert',
          tier: securityTier,
          level: getTierLevel(securityTier),
          reason: `Fixed ${metrics.totalFixes} issues (${metrics.criticalVulns} critical, ${metrics.highVulns} high)`
        })
      }
    }

    // Bug Fixer - FIXED TIER LOGIC
    const bugFixerTier = getBugFixerTier(metrics)
    if (bugFixerTier > 0) {
      const currentBugFixerBadge = currentBadges.find(b => b.badgeType === 'Bug Fixer')
      const currentTier = currentBugFixerBadge?.tier || 0
      
      if (bugFixerTier > currentTier) {
        eligibleBadges.push({
          badgeType: 'Bug Fixer',
          tier: bugFixerTier,
          level: getTierLevel(bugFixerTier),
          reason: `Completed ${metrics.totalAudits} audits`
        })
      }
    }

    // Verified Auditor - FIXED TIER LOGIC
    const verifiedTier = getVerifiedAuditorTier(reputation)
    if (verifiedTier > 0) {
      const currentVerifiedBadge = currentBadges.find(b => b.badgeType === 'Verified Auditor')
      const currentTier = currentVerifiedBadge?.tier || 0
      
      if (verifiedTier > currentTier) {
        eligibleBadges.push({
          badgeType: 'Verified Auditor',
          tier: verifiedTier,
          level: getTierLevel(verifiedTier),
          reason: `Reached ${reputation} reputation points`
        })
      }
    }

    // Perfect Score - FIXED TIER LOGIC
    const perfectTier = getPerfectScoreTier(metrics)
    if (perfectTier > 0) {
      const currentPerfectBadge = currentBadges.find(b => b.badgeType === 'Perfect Score')
      const currentTier = currentPerfectBadge?.tier || 0
      
      if (perfectTier > currentTier) {
        eligibleBadges.push({
          badgeType: 'Perfect Score',
          tier: perfectTier,
          level: getTierLevel(perfectTier),
          reason: `Achieved ${metrics.perfectScores} perfect scores`
        })
      }
    }

    return NextResponse.json({
      success: true,
      metrics,
      reputation,
      eligibleBadges, // Only shows badges user can actually upgrade to
      currentBadges: currentBadges
    })
  } catch (error: any) {
    console.error('Check eligibility error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// FIXED: Vulnerability Hunter tier calculation
function getVulnerabilityHunterTier(metrics: any): number {
  const total = metrics.totalVulnerabilities
  const high = metrics.highVulns
  const critical = metrics.criticalVulns
  
  // Tier 5: 100+ total, 10+ critical, 30+ high
  if (total >= 100 && critical >= 10 && high >= 30) return 5
  // Tier 4: 50+ total, 5+ critical, 15+ high  
  if (total >= 50 && critical >= 5 && high >= 15) return 4
  // Tier 3: 30+ total, 10+ high
  if (total >= 30 && high >= 10) return 3
  // Tier 2: 15+ total, 5+ high
  if (total >= 15 && high >= 5) return 2
  // Tier 1: 5+ total
  if (total >= 5) return 1
  
  return 0
}

// FIXED: Security Expert tier calculation
function getSecurityExpertTier(metrics: any): number {
  const fixes = metrics.totalFixes
  const critical = metrics.criticalVulns
  const high = metrics.highVulns
  
  // ALL conditions must be met for each tier
  if (fixes >= 100 && critical >= 30 && high >= 70) return 5
  if (fixes >= 50 && critical >= 15 && high >= 35) return 4
  if (fixes >= 25 && critical >= 8 && high >= 17) return 3
  if (fixes >= 10 && critical >= 3 && high >= 7) return 2
  if (fixes >= 3 && critical >= 1 && high >= 2) return 1
  
  return 0
}

function getBugFixerTier(metrics: any): number {
  const audits = metrics.totalAudits
  if (audits >= 120) return 5
  if (audits >= 60) return 4
  if (audits >= 30) return 3
  if (audits >= 15) return 2
  if (audits >= 5) return 1
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