"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Database, Shield, CheckCircle, ExternalLink, Filter, Loader } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface RegistryAudit {
  auditId: string
  contractHash: string
  auditor: string
  timestamp: number
  riskScore: number
  totalVulnerabilities: number
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
  ipfsReportCID: string
  network: string
  merkleRoot?: string
}

export default function RegistryPage() {
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")
  const [audits, setAudits] = useState<RegistryAudit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRisk, setFilterRisk] = useState<string>("all")
  const [userSubscription, setUserSubscription] = useState<any>(null)
  const { account } = useAuth()

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]

  useEffect(() => {
    loadAudits()
  }, [selectedNetwork])

  const loadAudits = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/registry/list?network=${selectedNetwork}`)
      const data = await response.json()

      if (account?.address) {
        try {
          const subResponse = await fetch(`/api/subscription/status?address=${account.address}&network=${selectedNetwork}`)
          const subData = await subResponse.json()
          if (subData.success && subData.hasSubscription) {
            setUserSubscription(subData.subscription)
          }
        } catch (e) {
          console.log('Subscription check skipped:', e)
        }
      }
      
      if (data.success) {
        setAudits(data.audits || [])
      }
    } catch (error) {
      console.error('Failed to load registry:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return "text-red-500"
    if (score >= 40) return "text-yellow-500"
    return "text-green-500"
  }

  const getRiskBadge = (score: number) => {
    if (score >= 70) return { label: "High", color: "bg-red-500/20 text-red-500 border-red-500/50" }
    if (score >= 40) return { label: "Medium", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" }
    return { label: "Low", color: "bg-green-500/20 text-green-500 border-green-500/50" }
  }

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.auditor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          audit.contractHash.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRisk = filterRisk === "all" ||
                        (filterRisk === "high" && audit.riskScore >= 70) ||
                        (filterRisk === "medium" && audit.riskScore >= 40 && audit.riskScore < 70) ||
                        (filterRisk === "low" && audit.riskScore < 40)
    
    return matchesSearch && matchesRisk
  })

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-4xl font-bold text-foreground pl-83">Vulnerability Registry</h1>
              <p className="text-foreground/60 pl-82">On-chain audit database - transparent and immutable</p>
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
          {/* Subscription Status */}
          {account?.isConnected && userSubscription && (
            <Card className="glass-effect border-accent/50 border-2 p-4 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground/60">Active Subscription</p>
                  <p className="text-xl font-bold text-accent">{userSubscription.tier}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-foreground/60">Expires</p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date(userSubscription.expiry).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-12 h-12 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Filters & Stats */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="glass-effect border-primary/50 border-2 p-6">
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="text-primary" size={20} />
                  Registry Stats
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-border">
                    <span className="text-foreground/80">Total Audits</span>
                    <span className="font-bold text-primary">{audits.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">High Risk</span>
                    <span className="font-semibold text-red-400">
                      {audits.filter(a => a.riskScore >= 70).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Medium Risk</span>
                    <span className="font-semibold text-yellow-400">
                      {audits.filter(a => a.riskScore >= 40 && a.riskScore < 70).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground/80">Low Risk</span>
                    <span className="font-semibold text-green-400">
                      {audits.filter(a => a.riskScore < 40).length}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="glass-effect border-border p-6">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <Filter className="text-accent" size={20} />
                  Filters
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-foreground/60 mb-2 block">Search</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Auditor or contract hash..."
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-foreground/60 mb-2 block">Risk Level</label>
                    <select
                      value={filterRisk}
                      onChange={(e) => setFilterRisk(e.target.value)}
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Levels</option>
                      <option value="high">High Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="low">Low Risk</option>
                    </select>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Audit List */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 pl-65">
                <Database className="text-primary" />
                Registered Audits
              </h2>

              {filteredAudits.length === 0 ? (
                <Card className="glass-effect border-border p-12 text-center">
                  <Database className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60 mb-2">No audits found</p>
                  <p className="text-sm text-foreground/40">
                    {audits.length === 0 
                      ? "No audits registered on this network yet"
                      : "Try adjusting your filters"}
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredAudits.map((audit, index) => (
                    <Card key={index} className="glass-effect border-border p-6 hover:border-primary/50 transition-all">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-foreground text-lg">Audit #{audit.auditId.slice(0, 8)}...</h3>
                              <span className={`px-3 py-1 rounded-full border text-xs font-bold ${getRiskBadge(audit.riskScore).color}`}>
                                {getRiskBadge(audit.riskScore).label} Risk
                              </span>
                            </div>
                            <p className="text-xs text-foreground/60 font-mono">
                              Contract: {audit.contractHash.slice(0, 20)}...
                            </p>
                          </div>
                          <div className={`text-right ${getRiskColor(audit.riskScore)}`}>
                            <p className="text-3xl font-bold">{audit.riskScore}</p>
                            <p className="text-xs">Risk Score</p>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-foreground/60">Auditor</p>
                            <p className="font-mono text-xs text-foreground">{audit.auditor.slice(0, 10)}...{audit.auditor.slice(-8)}</p>
                          </div>
                          <div>
                            <p className="text-foreground/60">Date</p>
                            <p className="text-foreground">{new Date(audit.timestamp * 1000).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Vulnerability Breakdown */}
                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-foreground/60 mb-2">
                            Total Vulnerabilities: <span className="font-bold text-foreground">{audit.totalVulnerabilities}</span>
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-red-500/20 p-2 rounded text-center">
                              <p className="text-xs text-red-400">Critical</p>
                              <p className="font-bold text-red-400">{audit.summary.critical}</p>
                            </div>
                            <div className="bg-orange-500/20 p-2 rounded text-center">
                              <p className="text-xs text-orange-400">High</p>
                              <p className="font-bold text-orange-400">{audit.summary.high}</p>
                            </div>
                            <div className="bg-yellow-500/20 p-2 rounded text-center">
                              <p className="text-xs text-yellow-400">Medium</p>
                              <p className="font-bold text-yellow-400">{audit.summary.medium}</p>
                            </div>
                            <div className="bg-blue-500/20 p-2 rounded text-center">
                              <p className="text-xs text-blue-400">Low</p>
                              <p className="font-bold text-blue-400">{audit.summary.low}</p>
                            </div>
                          </div>
                        </div>
                       
                        {audit.merkleRoot && (
                          <div className="pt-3 border-t border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Shield size={16} className="text-purple-400" />
                              <span className="text-sm text-foreground/60">Cryptographic Proof</span>
                            </div>
                            <span className="text-sm font-semibold text-purple-400 flex items-center gap-1">
                              <CheckCircle size={14} />
                              Verified
                            </span>
                          </div>
                        )}
                        {/* Actions */}
                        {audit.ipfsReportCID && (
                        <a 
                            href={`https://gateway.pinata.cloud/ipfs/${audit.ipfsReportCID}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/50 text-sm font-semibold text-primary transition-colors"
                          >
                            <ExternalLink size={14} />
                            View Full Report
                          </a>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}