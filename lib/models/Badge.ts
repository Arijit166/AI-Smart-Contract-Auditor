import { ObjectId } from 'mongodb'

export interface Badge {
  _id?: ObjectId
  userId: string
  badgeType: 'Vulnerability Hunter' | 'Gas Optimizer' | 'Security Expert' | 'Bug Fixer' | 'Verified Auditor' | 'Chain Specialist' | 'Perfect Score'
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5'
  tier: number 
  network: string
  tokenId: string
  auditId?: string
  auditHash: string
  fixedCodeHash?: string
  reputationSnapshot: number
  metricsSnapshot: {
    totalAudits: number
    totalVulnerabilities: number
    totalFixes: number
    perfectScores: number
    criticalVulns: number
    highVulns: number
    gasOptimizations?: number
    chainAudits?: number
  }
  ipfsMetadataCID: string
  ipfsPdfCID?: string
  transactionHash: string
  supersededBy?: string
  isCurrent: boolean
  isSoulbound: boolean
  mintedAt: Date
  createdAt: Date
  updatedAt: Date
}

export const BadgeCollection = 'badges'