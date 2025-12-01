import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'
import { BadgeCollection } from '@/lib/models/Badge'

export async function POST(request: NextRequest) {
  try {
    const { userAddress, network } = await request.json()

    if (!userAddress) {
      return NextResponse.json({ success: false, error: 'User address required' }, { status: 400 })
    }

    const db = await getDatabase()

    // Get user's audit stats
    const audits = await db.collection(AuditCollection)
      .find({ userId: userAddress.toLowerCase() })
      .toArray()

    const badges = await db.collection(BadgeCollection)
      .find({ userId: userAddress.toLowerCase(), network, isCurrent: true })
      .toArray()

    // Calculate metrics
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

    // Get reputation from on-chain or database
    const reputationData = await db.collection('reputation')
      .findOne({ address: userAddress.toLowerCase(), network })
    
    const reputation = reputationData?.totalReputation || 0

    // Check eligibility for each badge type
    const eligibleBadges = []

    // Vulnerability Hunter
    const vulnTier = getVulnerabilityHunterTier(metrics)
    if (vulnTier > 0) {
      const currentVulnBadge = badges.find(b => b.badgeType === 'Vulnerability Hunter')
      if (!currentVulnBadge || currentVulnBadge.tier < vulnTier) {
        eligibleBadges.push({
          badgeType: 'Vulnerability Hunter',
          tier: vulnTier,
          level: getTierLevel(vulnTier),
          reason: `Found ${metrics.totalVulnerabilities} vulnerabilities`
        })
      }
    }

    // Gas Optimizer
    // (Would need gas optimization tracking in audits)

    // Security Expert
    const securityTier = getSecurityExpertTier(metrics)
    if (securityTier > 0) {
      const currentSecurityBadge = badges.find(b => b.badgeType === 'Security Expert')
      if (!currentSecurityBadge || currentSecurityBadge.tier < securityTier) {
        eligibleBadges.push({
          badgeType: 'Security Expert',
          tier: securityTier,
          level: getTierLevel(securityTier),
          reason: `Fixed ${metrics.totalFixes} critical/high vulnerabilities`
        })
      }
    }

    // Bug Fixer
    const bugFixerTier = getBugFixerTier(metrics)
    if (bugFixerTier > 0) {
      const currentBugFixerBadge = badges.find(b => b.badgeType === 'Bug Fixer')
      if (!currentBugFixerBadge || currentBugFixerBadge.tier < bugFixerTier) {
        eligibleBadges.push({
          badgeType: 'Bug Fixer',
          tier: bugFixerTier,
          level: getTierLevel(bugFixerTier),
          reason: `Completed ${metrics.totalAudits} audits with fixes`
        })
      }
    }

    // Verified Auditor
    const verifiedTier = getVerifiedAuditorTier(reputation)
    if (verifiedTier > 0) {
      const currentVerifiedBadge = badges.find(b => b.badgeType === 'Verified Auditor')
      if (!currentVerifiedBadge || currentVerifiedBadge.tier < verifiedTier) {
        eligibleBadges.push({
          badgeType: 'Verified Auditor',
          tier: verifiedTier,
          level: `Level ${verifiedTier}`,
          reason: `Reached ${reputation} reputation points`
        })
      }
    }

    // Perfect Score
    const perfectTier = getPerfectScoreTier(metrics)
    if (perfectTier > 0) {
      const currentPerfectBadge = badges.find(b => b.badgeType === 'Perfect Score')
      if (!currentPerfectBadge || currentPerfectBadge.tier < perfectTier) {
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
      eligibleBadges,
      currentBadges: badges
    })
  } catch (error: any) {
    console.error('Check eligibility error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function getVulnerabilityHunterTier(metrics: any): number {
  const total = metrics.totalVulnerabilities
  const highPlus = metrics.criticalVulns + metrics.highVulns
  
  if (total >= 100 && highPlus >= 30) return 5
  if (total >= 50 && highPlus >= 15) return 4
  if (total >= 30 && highPlus >= 10) return 3
  if (total >= 15 && highPlus >= 5) return 2
  if (total >= 5) return 1
  return 0
}

function getSecurityExpertTier(metrics: any): number {
  const fixes = metrics.totalFixes
  const critical = metrics.criticalVulns
  const high = metrics.highVulns
  const totalCritHigh = critical + high
  
  if (fixes >= 100 && critical >= 30 && totalCritHigh >= 70) return 5
  if (fixes >= 50 && critical >= 15 && totalCritHigh >= 35) return 4
  if (fixes >= 25 && critical >= 8 && totalCritHigh >= 17) return 3
  if (fixes >= 10 && critical >= 3 && totalCritHigh >= 7) return 2
  if (fixes >= 3 && critical >= 1 && totalCritHigh >= 2) return 1
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