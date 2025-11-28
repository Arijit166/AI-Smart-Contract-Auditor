import { ObjectId } from 'mongodb'

export interface UserProfile {
  _id?: ObjectId
  walletAddress: string
  name: string
  profilePhoto?: string 
  createdAt: Date
  updatedAt: Date
}

export const UserProfileCollection = 'userProfiles'