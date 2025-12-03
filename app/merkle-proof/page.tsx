"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, CheckCircle, XCircle, Loader, Hash, FileCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function MerkleProofPage() {
  const { account } = useAuth()
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")
  const [auditId, setAuditId] = useState("")
  const [merkleData, setMerkleData] = useState<any>(null)
  const [selectedLeaf, setSelectedLeaf] = useState<any>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [storing, setStoring] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [isStored, setIsStored] = useState(false)
  const [verifiedLeaves, setVerifiedLeaves] = useState<Set<string>>(new Set())

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]

  const handleGenerateMerkle = async () => {
    if (!auditId.trim()) {
      alert("Please enter audit ID")
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/merkle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId })
      })

      const data = await response.json()
      if (data.success) {
        setMerkleData(data)
        setVerifiedLeaves(new Set()) // Reset verified leaves for new audit
      } else {
        alert('Failed: ' + data.error)
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStoreOnChain = async () => {
    if (!merkleData || !account?.address) return

    setStoring(true)
    try {
      const response = await fetch('/api/merkle/store-onchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          merkleRoot: merkleData.merkleRoot,
          auditor: account.address,
          network: selectedNetwork
        })
      })

      const data = await response.json()
      if (data.success) {
        setIsStored(true)
        alert('Stored on-chain! TX: ' + data.transactionHash)
      } else {
        alert('Failed: ' + data.error)
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setStoring(false)
    }
  }

  const handleVerifyLeaf = async () => {
    if (!selectedLeaf || !merkleData) return

    setVerifying(true)
    try {
      const response = await fetch('/api/merkle/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          leaf: selectedLeaf.hash,
          merkleProof: merkleData.proofs[selectedLeaf.hash],
          network: selectedNetwork
        })
      })

      const data = await response.json()
      if (data.success) {
        setVerificationResult(data)
        // Add to verified leaves set
        if (data.isValid) {
          setVerifiedLeaves(prev => new Set(prev).add(selectedLeaf.hash))
        }
      } else {
        alert('Failed: ' + data.error)
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setVerifying(false)
    }
  }

  const isLeafVerified = (leafHash: string) => verifiedLeaves.has(leafHash)

  return (
  <div className="min-h-screen bg-background p-6 md:p-8">
    <div className={`mx-auto space-y-8 transition-all duration-300 ${merkleData ? 'max-w-7xl' : 'max-w-3xl'}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">Decentralized Audit Proof</h1>
            <p className="text-foreground/60">Cryptographically verify audit integrity using Merkle Trees</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
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

      <div className={`grid gap-8 transition-all duration-300 ${merkleData ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 place-items-center'}`}>
        <div className={`space-y-6 ${!merkleData ? 'max-w-xl w-full' : ''}`}>
          <Card className="glass-effect border-border p-6 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Hash size={20} className="text-primary" />
              Generate Merkle Proof
            </h3>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Audit ID</label>
              <input
                type="text"
                value={auditId}
                onChange={(e) => setAuditId(e.target.value)}
                placeholder="Enter audit ID..."
                className="w-full bg-input border border-border rounded-lg mt-2 px-4 py-3 text-foreground"
              />
            </div>

            <Button
              onClick={handleGenerateMerkle}
              disabled={loading || !auditId.trim()}
              className="w-full bg-primary hover:bg-primary/90 gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Hash size={20} />
                  Generate Merkle Tree
                </>
              )}
            </Button>
          </Card>

          {merkleData && (
            <Card className="glass-effect border-primary/50 border-2 p-6 space-y-4">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <CheckCircle size={20} />
                Merkle Root Generated
              </h3>

              <div className="space-y-2">
                <label className="text-xs text-foreground/60">Root Hash</label>
                <div className="bg-input border border-border rounded-lg px-4 py-3 font-mono text-xs text-foreground break-all">
                  {merkleData.merkleRoot}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-foreground/60">Total Leaves</label>
                <p className="text-sm text-foreground">{merkleData.leaves.length}</p>
              </div>

              <Button
                onClick={handleStoreOnChain}
                disabled={storing || !account?.isConnected || isStored}
                className="w-full bg-green-500 hover:bg-green-600 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {storing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Storing...
                  </>
                ) : isStored ? (
                  <>
                    <CheckCircle size={20} />
                    Stored On-Chain ✓
                  </>
                ) : (
                  <>
                    <FileCheck size={20} />
                    Store On-Chain
                  </>
                )}
              </Button>
            </Card>
          )}
        </div>

        {merkleData && (
          <div className="space-y-6">
            <Card className="glass-effect border-border p-6 space-y-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Shield size={20} className="text-accent" />
                  Verify Leaf
                </h3>

                <div className="space-y-2">
                  <label className="text-xs text-foreground/60">Select Leaf to Verify</label>
                  <select
                    onChange={(e) => {
                      const leaf = merkleData.leaves.find((l: any) => l.hash === e.target.value)
                      setSelectedLeaf(leaf)
                      // Check if this leaf was already verified
                      if (leaf && isLeafVerified(leaf.hash)) {
                        setVerificationResult({ isValid: true, transactionHash: 'cached' })
                      } else {
                        setVerificationResult(null)
                      }
                    }}
                    className="w-full bg-input border border-border rounded-lg px-4 py-2 text-sm"
                  >
                    <option value="">Choose a leaf...</option>
                    {merkleData.leaves.map((leaf: any, idx: number) => (
                      <option key={idx} value={leaf.hash}>
                        {leaf.type} - {leaf.hash.slice(0, 20)}... {isLeafVerified(leaf.hash) ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedLeaf && (
                  <>
                    <div className="bg-input border border-border rounded-lg p-4 space-y-2">
                      <p className="text-xs text-foreground/60">Type</p>
                      <p className="text-sm font-semibold text-foreground">{selectedLeaf.type}</p>
                      <p className="text-xs text-foreground/60 mt-2">Hash</p>
                      <p className="text-xs font-mono text-foreground break-all">{selectedLeaf.hash}</p>
                    </div>

                    <Button
                      onClick={handleVerifyLeaf}
                      disabled={verifying || isLeafVerified(selectedLeaf.hash)}
                      className="w-full bg-blue-500 hover:bg-blue-600 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Verifying...
                        </>
                      ) : isLeafVerified(selectedLeaf.hash) ? (
                        <>
                          <CheckCircle size={20} />
                          Already Verified ✓
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Verify On-Chain
                        </>
                      )}
                    </Button>
                  </>
                )}

                {verificationResult && (
                  <Card className={`border-2 p-4 ${verificationResult.isValid ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'}`}>
                    <div className="flex items-center gap-3">
                      {verificationResult.isValid ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                      <div>
                        <p className={`font-semibold ${verificationResult.isValid ? 'text-green-500' : 'text-red-500'}`}>
                          {verificationResult.isValid ? 'Verification Successful' : 'Verification Failed'}
                        </p>
                        {verificationResult.transactionHash !== 'cached' && (
                          <p className="text-xs text-foreground/60 mt-1">TX: {verificationResult.transactionHash?.slice(0, 20)}...</p>
                        )}
                      </div>
                    </div>
                  </Card>
                )}
              </Card>
          </div>
        )}
      </div>
    </div>
  </div>
)}