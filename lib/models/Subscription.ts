import { ObjectId } from 'mongodb'

export interface Subscription {
  _id?: ObjectId
  userAddress: string
  tier: 'BASIC' | 'PRO' | 'ELITE'
  expiry: Date
  subscribedAt: Date
  network: string
  transactionHash?: string
  amount?: number
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export const SubscriptionCollection = 'subscriptions'