"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CodeEditor from "@/components/code-editor"
import AuditResults from "@/components/audit-results"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useAudit } from "@/lib/audit-context"
import { useRouter } from "next/navigation"
import { updateReputation } from "@/lib/services/reputation-service"
import SubscriptionRequiredModal from "@/components/subscription-required-modal"
import { useEffect } from "react"

export default function AuditPage() {
  const { account } = useAuth()
  const { setAuditData } = useAudit()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResults, setAuditResults] = useState(null)
  const [fileUploaded, setFileUploaded] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [showSubModal, setShowSubModal] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState('polygon-amoy')
  const [subscriptionTier, setSubscriptionTier] = useState<string>('NONE')
  const [auditCount, setAuditCount] = useState<number>(0)

  useEffect(() => {
    if (account?.address) {
      checkSubscriptionAndLimits()
    }
  }, [account?.address, selectedNetwork])

  const checkSubscriptionAndLimits = async () => {
    if (!account?.address) return;
    try {
      // Check subscription
      const subResponse = await fetch(`/api/subscription/status?address=${account.address}&network=${selectedNetwork}`)
      const subData = await subResponse.json()
      
      if (subData.success && subData.hasSubscription) {
        setSubscriptionTier(subData.subscription.tier)
      } else {
        setSubscriptionTier('NONE')
      }
      
      // Get audit count for current month
      const countResponse = await fetch(`/api/audit/count?address=${account.address}&network=${selectedNetwork}`)
      const countData = await countResponse.json()
      if (countData.success) {
        setAuditCount(countData.count)
      }
    } catch (e) {
      console.error('Failed to check subscription:', e)
    }
  }
  const handleFileSelect = (file: File) => {
    if (file && file.name.endsWith(".sol")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCode(event.target?.result as string)
        setFileUploaded(true)
      }
      reader.readAsText(file)
    } else {
      alert("Please upload a .sol file")
    }
  }
  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleRunAudit = async () => {
    if (!code.trim()) {
      alert("Please provide code to audit")
      return
    }
    
    // ✅ CHECK SUBSCRIPTION LIMITS
    const limits: Record<string, number> = {
      'NONE': 3,      // Free tier: 3 audits/month
      'BASIC': 10,
      'PRO': 50,
      'ELITE': 999999 // Unlimited
    }
    
    const currentLimit = limits[subscriptionTier]
    
    if (auditCount >= currentLimit) {
      alert(`⚠️ Audit limit reached!\n\nYour current plan (${subscriptionTier}) allows ${currentLimit} audits per month.\n\nUpgrade your subscription to continue.`)
      router.push('/subscription')
      return
    }
    
    setIsAuditing(true)
    setAuditResults(null)
    
    try {
      // Run audit
      const response = await fetch("/api/audit/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
      
      if (!response.ok) {
        throw new Error("Audit failed")
      }
      
      const data = await response.json()
      
      const auditResultsData = {
        ...data.audit,
        rawOutput: JSON.stringify(data, null, 2)
      }
      setAuditResults(auditResultsData)

      const hasHighRiskFixes = data.audit.vulnerabilities?.some(
        (v: any) => v.severity === 'critical' || v.severity === 'high'
      )

      if (hasHighRiskFixes && account?.address) {
        await updateReputation('fix', account.address, selectedNetwork)
      }

      // ✅ SAVE AUDIT DATA TO CONTEXT
      const dataToSave = {
        originalCode: code,
        fixedCode: data.audit.fixedCode || code,
        riskScore: data.audit.riskScore || 0,
        vulnerabilities: data.audit.vulnerabilities || [],
        suggestions: data.audit.suggestions || [], 
        contractName: data.audit.contractName || 'Contract',
        timestamp: Date.now(),
        merkleRoot: undefined as string | undefined,
        auditId: undefined as string | undefined
      }
      
      setAuditData(dataToSave)
     
      // Save to database
      if (account?.address) {
        await fetch("/api/audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractCode: code,
            userAddress: account.address,
            auditResults: data.audit,
            network: selectedNetwork,
          }),
        });await updateReputation('audit', account.address, selectedNetwork)
          if (account?.address) {
            const auditResponse = await fetch("/api/audit", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contractCode: code,
                userAddress: account.address,
                auditResults: data.audit,
                network: selectedNetwork,
              }),
            });
            
            const auditDbResult = await auditResponse.json()
            const auditDbId = auditDbResult.auditId || `audit-${Date.now()}`
            
            await updateReputation('audit', account.address, selectedNetwork)
            try {
              const rewardResponse = await fetch('/api/rewards/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  auditorAddress: account.address,
                  amount: 5, // 5 AUDIT tokens per audit
                  network: selectedNetwork,
                  reason: 'audit_completion'
                })
              })
              
              const rewardData = await rewardResponse.json()
              if (rewardData.success) {
                console.log('✅ Audit reward distributed:', rewardData.amount, 'AUDIT')
              }
            } catch (e) {
              console.log('Reward distribution skipped:', e)
            }
            // Merkle generation with captured audit ID
            try {
              const merkleResponse = await fetch("/api/merkle/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auditId: auditDbId }),
              })
              const merkleData = await merkleResponse.json()
              
              if (merkleData.success) {
                console.log('✅ Merkle tree generated:', merkleData.merkleRoot)
                dataToSave.merkleRoot = merkleData.merkleRoot
                dataToSave.auditId = auditDbId
                setAuditData(dataToSave)
              }
            } catch (e) {
              console.log('Merkle generation skipped:', e)
            }
          }
          try {
            const badgeCheck = await fetch('/api/badges/check-eligibility', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userAddress: account.address, 
                network: selectedNetwork 
              })
            })
            const badgeData = await badgeCheck.json()
            
            if (badgeData.success && badgeData.eligibleBadges?.length > 0) {
              // Show notification that user earned new badges
              const badgeNames = badgeData.eligibleBadges.map((b: any) => b.badgeType).join(', ')
              setTimeout(() => {
                if (confirm(`🎉 You're eligible for new badges: ${badgeNames}!\n\nGo to Badges page to mint them?`)) {
                  router.push('/badges')
                }
              }, 1000)
            }
          } catch (e) {
            console.log('Badge check skipped:', e)
          }
        }
    } catch (error) {
      console.error("Audit error:", error)
      alert("Audit failed. Please check if the backend is running.")
    } finally {
      setIsAuditing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Smart Contract Audit</h1>
          <p className="text-foreground/60">Upload and analyze your Solidity contracts for vulnerabilities</p>
        </div>
        <div className="flex gap-3 mb-6 justify-center">
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
        {account?.isConnected && (
          <div className="mb-6 flex justify-center">
            <Card className="glass-effect border-border p-3 max-w-md">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <span className="text-foreground/60">Plan: </span>
                  <span className="font-bold text-primary">{subscriptionTier}</span>
                </div>
                <div>
                  <span className="text-foreground/60">Audits: </span>
                  <span className="font-bold text-foreground">
                    {auditCount}/{subscriptionTier === 'ELITE' ? '∞' : subscriptionTier === 'PRO' ? '50' : subscriptionTier === 'BASIC' ? '10' : '3'}
                  </span>
                </div>
                {subscriptionTier === 'NONE' && (
                  <a href="/subscription" className="text-primary hover:underline text-xs">
                    Upgrade →
                  </a>
                )}
              </div>
            </Card>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Upload & Code Editor */}
          <div className="space-y-6">
            {/* File Upload Box */}
            <Card
              className="glass-effect border-border hover:border-primary/50 transition-all p-8 text-center cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".sol"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:glow-cyan transition-all">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Drag & drop your .sol file</p>
                  <p className="text-sm text-foreground/60">or click to browse</p>
                </div>
                {fileUploaded && (
                  <div className="flex items-center gap-2 text-primary">
                    <FileText size={16} />
                    <span className="text-sm">File loaded successfully</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Code Editor */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">Solidity Code</label>
              <CodeEditor value={code} onChange={setCode} />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleRunAudit}
                disabled={!code || isAuditing}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all hover:scale-105"
              >
                {isAuditing ? "Auditing..." : "Run Audit"}
              </Button>
              <Button variant="outline" onClick={() => setCode("")} className="border-border hover:bg-card">
                Clear
              </Button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div>
            {!auditResults ? (
              <Card className="glass-effect border-border p-8 h-full flex items-center justify-center min-h-96">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60">Run an audit to see results</p>
                </div>
              </Card>
            ) : (
              <AuditResults results={auditResults} />
            )}
          </div>
        </div>
      </div>
        {/* Subscription Modal */}
        <SubscriptionRequiredModal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          onSubscribe={() => {
            setShowSubModal(false)
            router.push('/subscription')
          }}
          message="You need an active subscription to run smart contract audits."
          title="Subscription Required"
        />
    </div>
  )
}