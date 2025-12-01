"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Star, Trophy, Shield, Zap, TrendingUp, Check, Loader, ChevronRight, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface Badge {
  badgeType: string
  level: string
  tier: number
  tokenId: string
  ipfsMetadataCID: string
  transactionHash: string
  reputationSnapshot: number
  mintedAt: string
  isCurrent: boolean
}

interface EligibleBadge {
  badgeType: string
  tier: number
  level: string
  reason: string
}

export default function BadgesPage() {
  const { account } = useAuth()
  const [currentBadges, setCurrentBadges] = useState<Badge[]>([])
  const [supersededBadges, setSupersededBadges] = useState<Badge[]>([])
  const [eligibleBadges, setEligibleBadges] = useState<EligibleBadge[]>([])
  const [metrics, setMetrics] = useState<any>(null)
  const [reputation, setReputation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [minting, setMinting] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]

  const badgeIcons: Record<string, any> = {
    "Vulnerability Hunter": Shield,
    "Gas Optimizer": Zap,
    "Security Expert": Trophy,
    "Bug Fixer": Award,
    "Verified Auditor": Star,
    "Perfect Score": Check,
    "Chain Specialist": TrendingUp
  }

  const badgeColors: Record<string, string> = {
    "Vulnerability Hunter": "from-red-500 to-orange-500",
    "Gas Optimizer": "from-yellow-500 to-green-500",
    "Security Expert": "from-purple-500 to-pink-500",
    "Bug Fixer": "from-blue-500 to-cyan-500",
    "Verified Auditor": "from-amber-500 to-yellow-500",
    "Perfect Score": "from-green-500 to-emerald-500",
    "Chain Specialist": "from-indigo-500 to-blue-500"
  }

  const tierColors: Record<number, string> = {
    1: "text-orange-400 border-orange-400/50",
    2: "text-gray-300 border-gray-300/50",
    3: "text-yellow-400 border-yellow-400/50",
    4: "text-cyan-400 border-cyan-400/50",
    5: "text-purple-400 border-purple-400/50"
  }

  useEffect(() => {
    if (account?.address) {
      loadBadges()
      checkEligibility()
    }
  }, [account?.address, selectedNetwork])

  const loadBadges = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/badges/user?address=${account?.address}&network=${selectedNetwork}`)
      const data = await response.json()
      
      if (data.success) {
        setCurrentBadges(data.currentBadges || [])
        setSupersededBadges(data.supersededBadges || [])
      }
    } catch (error) {
      console.error('Failed to load badges:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkEligibility = async () => {
    try {
      const response = await fetch('/api/badges/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAddress: account?.address, network: selectedNetwork })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setEligibleBadges(data.eligibleBadges || [])
        setMetrics(data.metrics)
        setReputation(data.reputation)
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error)
    }
  }

  const handleMintBadge = async (badge: EligibleBadge) => {
    if (!account?.address) return

    setMinting(badge.badgeType)
    try {
      const response = await fetch('/api/badges/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account.address,
          badgeType: badge.badgeType,
          tier: badge.tier,
          level: badge.level,
          network: selectedNetwork,
          metrics: metrics,
          reputation: reputation
        })
      })

      const data = await response.json()
      
      if (data.success) {
        await loadBadges()
        await checkEligibility()
        alert(`Badge minted successfully! Token ID: ${data.tokenId}`)
      } else {
        alert(`Failed to mint badge: ${data.error}`)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setMinting(null)
    }
  }

  const getBadgeIcon = (badgeType: string) => {
    const Icon = badgeIcons[badgeType] || Award
    return Icon
  }

  const getExplorerLink = (txHash: string) => {
    const explorers: Record<string, string> = {
      'polygon-amoy': 'https://amoy.polygonscan.com/tx/',
      'flow-testnet': 'https://evm-testnet.flowscan.io/tx/',
      'celo-sepolia': 'https://alfajores.celoscan.io/tx/',
    }
    return explorers[selectedNetwork] + txHash
  }
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="ml-71 w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Award className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground pl-17">NFT Badges</h1>
              <p className="text-foreground/60">Earn and collect achievement badges for your auditing skills</p>
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

        {!account?.isConnected ? (
          <Card className="glass-effect border-border p-12 text-center">
            <Award className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Connect Your Wallet</h3>
            <p className="text-foreground/60">Connect your wallet to view and mint achievement badges</p>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-effect border-primary/50 border-2 p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Star className="text-primary" size={20} />
                  Your Stats
                </h3>
                {metrics && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-border">
                      <span className="text-foreground/80">Reputation</span>
                      <span className="font-bold text-primary">{reputation}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/80">Total Audits</span>
                      <span className="font-semibold text-foreground">{metrics.totalAudits}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/80">Vulnerabilities Found</span>
                      <span className="font-semibold text-foreground">{metrics.totalVulnerabilities}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/80">Critical Vulnerabilities</span>
                      <span className="font-semibold text-red-400">{metrics.criticalVulns}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/80">High Vulnerabilities</span>
                      <span className="font-semibold text-orange-400">{metrics.highVulns}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/80">Fixes Applied</span>
                      <span className="font-semibold text-foreground">{metrics.totalFixes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-foreground/80">Perfect Scores</span>
                      <span className="font-semibold text-green-400">{metrics.perfectScores}</span>
                    </div>
                  </div>
                )}
              </Card>

              <Card className="glass-effect border-border p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Trophy className="text-accent" size={20} />
                  Badge Collection
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Current Badges</span>
                    <span className="font-bold text-primary">{currentBadges.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Total Earned</span>
                    <span className="font-semibold text-foreground">{currentBadges.length + supersededBadges.length}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Badges */}
            <div className="lg:col-span-2 space-y-6">
              {/* Eligible Badges */}
              {eligibleBadges.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Zap className="text-primary" />
                    Ready to Mint
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {eligibleBadges.map((badge, index) => {
                      const Icon = getBadgeIcon(badge.badgeType)
                      const isMinting = minting === badge.badgeType
                      
                      return (
                        <Card key={index} className="glass-effect border-primary/50 border-2 p-6 hover:border-primary transition-all">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${badgeColors[badge.badgeType]} flex items-center justify-center glow-cyan`}>
                                <Icon className="w-8 h-8 text-white" />
                              </div>
                              <div className={`px-3 py-1 rounded-full border-2 ${tierColors[badge.tier]}`}>
                                <span className="text-xs font-bold">{badge.level}</span>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-lg mb-1">{badge.badgeType}</h3>
                              <p className="text-sm text-foreground/60">{badge.reason}</p>
                            </div>
                            <Button
                              onClick={() => handleMintBadge(badge)}
                              disabled={isMinting}
                              className="w-full bg-primary hover:bg-primary/90 gap-2"
                            >
                              {isMinting ? (
                                <>
                                  <Loader className="w-4 h-4 animate-spin" />
                                  Minting...
                                </>
                              ) : (
                                <>
                                  <Award size={16} />
                                  Mint Badge NFT
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Current Badges */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Trophy className="text-primary" />
                  Your Badges
                </h2>
                {currentBadges.length === 0 ? (
                  <Card className="glass-effect border-border p-12 text-center">
                    <Award className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
                    <p className="text-foreground/60 mb-2">No badges yet</p>
                    <p className="text-sm text-foreground/40">Complete audits to earn your first badge!</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentBadges.map((badge, index) => {
                      const Icon = getBadgeIcon(badge.badgeType)
                      
                      return (
                        <Card key={index} className="glass-effect border-border p-6 hover:border-primary/50 transition-all">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${badgeColors[badge.badgeType]} flex items-center justify-center`}>
                                <Icon className="w-8 h-8 text-white" />
                              </div>
                              <div className={`px-3 py-1 rounded-full border-2 ${tierColors[badge.tier]}`}>
                                <span className="text-xs font-bold">{badge.level}</span>
                              </div>
                            </div>
                            <div>
                              <h3 className="font-bold text-foreground text-lg mb-1">{badge.badgeType}</h3>
                              <p className="text-xs text-foreground/60 mb-2">
                                Token ID: #{badge.tokenId}
                              </p>
                              <p className="text-xs text-foreground/60">
                                Minted: {new Date(badge.mintedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`https://gateway.pinata.cloud/ipfs/${badge.ipfsMetadataCID}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 text-sm transition-colors"
                              >
                                <ExternalLink size={14} />
                                Metadata
                              </a>
                              <a
                                href={getExplorerLink(badge.transactionHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 text-sm transition-colors"
                              >
                                <ExternalLink size={14} />
                                Transaction
                              </a>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}