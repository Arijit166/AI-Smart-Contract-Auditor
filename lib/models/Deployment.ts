import { ObjectId } from 'mongodb'

export interface Deployment {
  _id?: ObjectId
  userId: string
  contractName: string
  contractCode: string
  compiledBytecode: string
  abi: any[]
  network: 'polygon-amoy' | 'ethereum-sepolia' | 'arbitrum-sepolia'
  contractAddress: string
  deploymentHash: string
  gasUsed: string
  status: 'pending' | 'success' | 'failed'
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export const DeploymentCollection = 'deployments'