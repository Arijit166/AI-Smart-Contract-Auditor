export type ReputationAction = 'audit' | 'deployment' | 'fix' | 'penalty'

export interface UserStats {
  address: string
  totalReputation: string
  auditsCompleted: string
  deploymentsCompleted: string
  fixesApplied: string
  penalties: string
}

export interface LeaderboardEntry {
  rank: number
  address: string
  reputation: string
}

/**
 * Update user reputation on-chain
 */
export async function updateReputation(
  action: ReputationAction,
  userAddress: string,
  network: string = 'polygon-amoy'
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const response = await fetch('/api/reputation/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        userAddress,
        network
      })
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update reputation')
    }

    return data
  } catch (error: any) {
    console.error('Reputation update error:', error)
    return {
      success: false,
      error: error.message || 'Failed to update reputation'
    }
  }
}

/**
 * Get user reputation stats
 */
export async function getUserStats(
  address: string,
  network: string = 'polygon-amoy'
): Promise<{ success: boolean; userStats?: UserStats; error?: string }> {
  try {
    const response = await fetch(
      `/api/reputation/get?address=${address}&network=${network}`
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch user stats')
    }

    return data
  } catch (error: any) {
    console.error('Get user stats error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch user stats'
    }
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  limit: number = 10,
  network: string = 'polygon-amoy'
): Promise<{ 
  success: boolean
  leaderboard?: LeaderboardEntry[]
  totalParticipants?: string
  error?: string 
}> {
  try {
    const response = await fetch(
      `/api/reputation/get?leaderboard=true&limit=${limit}&network=${network}`
    )

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch leaderboard')
    }

    return data
  } catch (error: any) {
    console.error('Get leaderboard error:', error)
    return {
      success: false,
      error: error.message || 'Failed to fetch leaderboard'
    }
  }
}