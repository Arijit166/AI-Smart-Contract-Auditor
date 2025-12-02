"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, ExternalLink, CheckCircle, XCircle, Loader, Shield } from "lucide-react"

export default function VerificationPage() {
  const [network, setNetwork] = useState("polygon-amoy")
  const [contractAddress, setContractAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]

  const handleVerify = async () => {
    if (!contractAddress.trim()) {
      setError("Please enter a contract address")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(
        `/api/onchain/verify?network=${network}&contractAddress=${contractAddress}`
      )
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Verification failed")
        return
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message || "Verification error")
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
    if (score >= 70) return { label: "High Risk", color: "bg-red-500/20 text-red-500 border-red-500/50" }
    if (score >= 40) return { label: "Medium Risk", color: "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" }
    return { label: "Low Risk", color: "bg-green-500/20 text-green-500 border-green-500/50" }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto ml-12 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 pl-65">
            <h1 className="text-3xl font-bold text-foreground">Contract Verification</h1>
          </div>
          <p className="text-foreground/60 pl-50">
            Verify smart contracts on-chain and view their audit certificates
          </p>
        </div>

        {/* Search Card */}
        <Card className="glass-effect border-border p-6 space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">Select Network</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {networks.map((net) => (
                <button
                  key={net.id}
                  onClick={() => setNetwork(net.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    network === net.id
                      ? "border-primary bg-primary/10 glow-cyan"
                      : "border-border hover:border-primary/50 bg-card"
                  }`}
                >
                  <span className="text-xl mr-2">{net.icon}</span>
                  <p className="font-semibold text-foreground text-sm">{net.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">Contract Address</label>
            <input
              type="text"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="0x..."
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={loading || !contractAddress.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all hover:scale-105 gap-2"
            size="lg"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search size={20} />
                Verify Contract
              </>
            )}
          </Button>
        </Card>

        {/* Error */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10 p-4">
            <div className="flex gap-3">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          </Card>
        )}

        {/* Results */}
        {result && !result.isAudited && (
          <Card className="border-yellow-500/50 bg-yellow-500/10 p-6">
            <div className="flex gap-3">
              <XCircle className="w-6 h-6 text-yellow-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-600 mb-1">Not Audited</h3>
                <p className="text-sm text-yellow-600/80">
                  This contract has not been audited on the blockchain yet.
                </p>
              </div>
            </div>
          </Card>
        )}
        {result && result.isAudited && result.audit.merkleRoot && (
          <Card className="glass-effect border-purple-500/50 border-2 p-6 space-y-4 mt-6">
            <div className="flex items-center gap-3 text-purple-400">
              <Shield size={24} />
              <h3 className="text-xl font-bold">Cryptographic Proof Available ✓</h3>
            </div>

            <p className="text-sm text-foreground/60">
              This audit has been cryptographically verified using Merkle Tree proof
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Merkle Root Hash</label>
              <div className="bg-input border border-border rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
                {result.audit.merkleRoot}
              </div>
            </div>

            <a
              href={`/merkle-proof?network=${network}&contract=${contractAddress}`}
              className="flex items-center justify-center gap-2 p-4 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/50 transition-colors group"
            >
              <span className="font-semibold text-purple-400">Verify Merkle Proof On-Chain</span>
              <ExternalLink size={16} className="text-purple-400 group-hover:scale-110 transition-transform" />
            </a>
          </Card>
        )}
        {result && result.isAudited && (
          <Card className="glass-effect border-primary/50 border-2 p-6 space-y-6">
            {/* Success Header */}
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle size={24} />
              <h3 className="text-xl font-bold">Audit Found ✓</h3>
            </div>

            {/* Risk Score */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">Risk Score</label>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-input border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-4xl font-bold ${getRiskColor(result.audit.riskScore)}`}>
                      {result.audit.riskScore}/100
                    </span>
                    <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${getRiskBadge(result.audit.riskScore).color}`}>
                      {getRiskBadge(result.audit.riskScore).label}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Hashes */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Original Code Hash</label>
                <div className="bg-input border border-border rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
                  {result.audit.originalCodeHash}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Fixed Code Hash</label>
                <div className="bg-input border border-border rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
                  {result.audit.fixedCodeHash}
                </div>
              </div>
            </div>

            {/* Auditor & Timestamp */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Auditor Address</label>
                <div className="bg-input border border-border rounded-lg px-4 py-3 font-mono text-sm text-foreground break-all">
                  {result.audit.auditor}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Audit Timestamp</label>
                <div className="bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground">
                  {new Date(result.audit.timestamp * 1000).toLocaleString()}
                </div>
              </div>
            </div>

            {/* IPFS Links */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">Audit Resources</label>
              <div className="grid md:grid-cols-2 gap-3">
                <a
                  href={result.audit.ipfsLinks.pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/50 transition-colors group"
                >
                  <span className="font-semibold text-primary">View PDF Report</span>
                  <ExternalLink size={16} className="text-primary group-hover:scale-110 transition-transform" />
                </a>
                
                <a
                  href={result.audit.ipfsLinks.code}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/50 transition-colors group"
                >
                  <span className="font-semibold text-primary">View Source Code</span>
                  <ExternalLink size={16} className="text-primary group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </div>

            {/* Network Info */}
            <div className="pt-4 border-t border-border text-sm text-foreground/60">
              <p>Network: <span className="text-primary font-semibold">{networks.find(n => n.id === network)?.name}</span></p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}