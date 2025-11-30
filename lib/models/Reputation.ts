import { ObjectId } from "mongodb"

export interface ReputationEvent {
  _id?: ObjectId
  userId: string
  action: 'audit' | 'deployment' | 'fix' | 'penalty'
  points: number
  transactionHash: string
  network: string
  createdAt: Date
}