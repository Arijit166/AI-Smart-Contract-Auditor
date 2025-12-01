"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Trophy, Star, Zap, Shield, TrendingUp, Award, Users } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getUserStats, getLeaderboard, type UserStats, type LeaderboardEntry } from "@/lib/services/reputation-service"

export default function ReputationPage() {
  const { account } = useAuth()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [totalParticipants, setTotalParticipants] = useState<string>("0")
  const [loading, setLoading] = useState(true)
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")
  const [userBadges, setUserBadges] = useState<any[]>([])

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]

  useEffect(() => {
    loadData()
  }, [account?.address, selectedNetwork])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load user stats if wallet connected
      if (account?.address) {
        const statsResult = await getUserStats(account.address, selectedNetwork)
        if (statsResult.success && statsResult.userStats) {
          setUserStats(statsResult.userStats)
        }
      }

      // Load leaderboard
      const leaderboardResult = await getLeaderboard(10, selectedNetwork)
      if (leaderboardResult.success) {
        setLeaderboard(leaderboardResult.leaderboard || [])
        setTotalParticipants(leaderboardResult.totalParticipants || "0")
      }
      if (account?.address) {
        try {
          const badgeResponse = await fetch(`/api/badges/user?address=${account.address}&network=${selectedNetwork}`)
          const badgeData = await badgeResponse.json()
          if (badgeData.success) {
            setUserBadges(badgeData.currentBadges || [])
          }
        } catch (e) {
          console.log('Failed to load badges:', e)
        }
      }
    } catch (error) {
      console.error("Failed to load reputation data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return `#${rank}`
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="ml-71 w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Trophy className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground pl-17">Leaderboard</h1>
              <p className="text-foreground/60">Earn points for auditing, deploying, and fixing contracts</p>
            </div>
          </div>

          {/* Network Selection */}
          <div className="flex gap-3 pl-73">
            {networks.map((network) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network.id)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedNetwork === network.id
                    ? "border-primary bg-primary/10 glow-cyan"
                    : "border-border hover:border-primary/50 bg-card"
                }`}
              >
                <span className="mr-2">{network.icon}</span>
                <span className="text-sm font-semibold">{network.name}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - User Stats */}
            <div className="lg:col-span-1 space-y-6">
              {account?.isConnected && userStats ? (
                <>
                  {/* Total Reputation */}
                  <Card className="glass-effect border-primary/50 border-2 p-6">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan">
                        <Star className="w-10 h-10 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60 font-semibold mb-1">Your Reputation</p>
                        <p className="text-5xl font-bold text-primary">{userStats.totalReputation}</p>
                      </div>
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-foreground/60">
                          {formatAddress(userStats.address)}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Stats Breakdown */}
                  <Card className="glass-effect border-border p-6 space-y-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <Award size={20} className="text-primary" />
                      Points Breakdown
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Audits</p>
                            <p className="text-xs text-foreground/60">{userStats.auditsCompleted} completed</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-blue-400">
                          +{parseInt(userStats.auditsCompleted) * 10}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-3">
                          <TrendingUp className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Deployments</p>
                            <p className="text-xs text-foreground/60">{userStats.deploymentsCompleted} completed</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-green-400">
                          +{parseInt(userStats.deploymentsCompleted) * 20}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">Fixes</p>
                            <p className="text-xs text-foreground/60">{userStats.fixesApplied} applied</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold text-purple-400">
                          +{parseInt(userStats.fixesApplied) * 5}
                        </p>
                      </div>

                      {parseInt(userStats.penalties) > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/50">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">⚠️</span>
                            <div>
                              <p className="text-sm font-semibold text-red-400">Penalties</p>
                              <p className="text-xs text-red-400/80">{userStats.penalties} received</p>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-red-400">
                            -{parseInt(userStats.penalties) * 10}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                   {userBadges.length > 0 && (
                    <Card className="glass-effect border-border p-6 space-y-4">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Award size={20} className="text-accent" />
                        Your Badges ({userBadges.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {userBadges.slice(0, 4).map((badge: any, idx: number) => (
                          <div key={idx} className="p-2 rounded-lg bg-card border border-border text-center">
                            <p className="text-xs font-bold text-primary">{badge.badgeType}</p>
                            <p className="text-xs text-foreground/60">{badge.level}</p>
                          </div>
                        ))}
                      </div>
                      {userBadges.length > 4 && (
                        <a href="/badges" className="text-xs text-primary hover:underline block text-center">
                          View all {userBadges.length} badges →
                        </a>
                      )}
                    </Card>
                  )}
                </>
              ) : (
                <Card className="glass-effect border-border p-8 text-center">
                  <Trophy className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60 mb-2">Connect your wallet</p>
                  <p className="text-sm text-foreground/40">to see your reputation stats</p>
                </Card>
              )}

              {/* How to Earn Points */}
              <Card className="glass-effect border-border p-6 space-y-3">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Star size={20} className="text-accent" />
                  How to Earn Points
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Complete an audit</span>
                    <span className="font-bold text-primary">+10 pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Deploy a contract</span>
                    <span className="font-bold text-primary">+20 pts</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Fix high-risk issue</span>
                    <span className="font-bold text-primary">+5 pts</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-foreground/80">Contract exploited</span>
                    <span className="font-bold text-red-400">-10 pts</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Leaderboard */}
            <div className="lg:col-span-2">
              <Card className="glass-effect border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Trophy className="text-primary" />
                    Leaderboard
                  </h2>
                  <div className="flex items-center gap-2 text-foreground/60">
                    <Users size={18} />
                    <span className="text-sm">{totalParticipants} participants</span>
                  </div>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
                    <p className="text-foreground/60">No participants yet</p>
                    <p className="text-sm text-foreground/40 mt-2">Be the first to earn reputation!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry) => {
                      const isCurrentUser = account?.address?.toLowerCase() === entry.address.toLowerCase()
                      
                      return (
                        <div
                          key={entry.address}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                            isCurrentUser
                              ? "bg-primary/20 border-2 border-primary glow-cyan"
                              : "bg-card border border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center font-bold text-lg">
                              {getRankIcon(entry.rank)}
                            </div>
                            <div>
                              <p className={`font-mono text-sm ${isCurrentUser ? "text-primary font-bold" : "text-foreground"}`}>
                                {formatAddress(entry.address)}
                                {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-primary" />
                            <span className="text-xl font-bold text-primary">{entry.reputation}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}