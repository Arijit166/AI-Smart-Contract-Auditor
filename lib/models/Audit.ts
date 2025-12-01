import { ObjectId } from 'mongodb'

export interface Audit {
  _id?: ObjectId
  userId: string
  network: string
  contractName: string
  contractCode: string
  riskScore: number
  vulnerabilities: Array<{
    id: number
    severity: 'critical' | 'high' | 'medium' | 'low'
    title: string
    line: number
    description: string
    impact: string
    recommendation: string
  }>
  suggestions: string[]
  fixedCode?: string
  status: 'completed' | 'failed'
  deploymentId?: string
  createdAt: Date
  updatedAt: Date
  nftTokenId?: string
  nftTransactionHash?: string
  ipfsMetadataCID?: string
  onChainPublished?: boolean
  onChainTxHash?: string
}

export const AuditCollection = 'audits'