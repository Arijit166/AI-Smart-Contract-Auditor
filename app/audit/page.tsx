"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CodeEditor from "@/components/code-editor"
import AuditResults from "@/components/audit-results"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function AuditPage() {
  const { account } = useAuth()
  const [code, setCode] = useState("")
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResults, setAuditResults] = useState(null)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [mintingNFT, setMintingNFT] = useState(false)
  const [publishingOnChain, setPublishingOnChain] = useState(false)
  const [nftResult, setNftResult] = useState<any>(null)
  const [publishResult, setPublishResult] = useState<any>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [deploymentAddress, setDeploymentAddress] = useState<string | null>(null)

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
    
    setIsAuditing(true)
    setAuditResults(null)
    
    try {
      // Run audit
      const response = await fetch("http://localhost:8000/api/audit", {
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
      setAuditResults({
        ...data.audit,
        rawOutput: JSON.stringify(data, null, 2)
      })

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
          }),
        })
      }
    } catch (error) {
      console.error("Audit error:", error)
      alert("Audit failed. Please check if the backend is running.")
    } finally {
      setIsAuditing(false)
    }
  }

  const handleMintNFT = async () => {
    if (!auditResults || !account?.address) return

    setMintingNFT(true)
    try {
      const response = await fetch('/api/onchain/mint-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: 'polygon-amoy',
          userAddress: account.address,
          originalCode: code,
          fixedCode: (auditResults as any).fixedCode || '',
          auditData: {
            riskScore: (auditResults as any).riskScore || 0,
            vulnerabilities: (auditResults as any).vulnerabilities || [],
          },
        }),
      })

      const data = await response.json()
      if (data.success) {
        setNftResult(data)
        alert('NFT Certificate minted successfully!')
      } else {
        alert('Failed to mint NFT: ' + data.error)
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setMintingNFT(false)
    }
  }

  const handlePublishOnChain = async () => {
    if (!nftResult || !deploymentAddress) {
      alert('Please mint NFT certificate and deploy contract first')
      return
    }

    setPublishingOnChain(true)
    try {
      const response = await fetch('/api/onchain/publish-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: 'polygon-amoy',
          contractAddress: deploymentAddress,
          originalCodeHash: nftResult.ipfs.originalCodeCID,
          fixedCodeHash: nftResult.ipfs.fixedCodeCID,
          riskScore: (auditResults as any)?.riskScore || 0,
          ipfsPdfCID: nftResult.ipfs.pdfCID,
          ipfsCodeCID: nftResult.ipfs.fixedCodeCID,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPublishResult(data)
        alert('Audit published on-chain successfully!')
      } else {
        alert('Failed to publish: ' + data.error)
      }
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setPublishingOnChain(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 pl-85">Smart Contract Audit</h1>
          <p className="text-foreground/60 pl-78">Upload and analyze your Solidity contracts for vulnerabilities</p>
        </div>

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
          {auditResults && (
            <div className="col-span-1 lg:col-span-2">
              <Card className="glass-effect border-border p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={handleMintNFT}
                      disabled={mintingNFT || !account?.isConnected}
                      className="flex-1 bg-purple-500 hover:bg-purple-600"
                    >
                      {mintingNFT ? 'Minting...' : '🎨 Mint NFT Certificate'}
                    </Button>
                    
                    {nftResult && (
                      <Button
                        onClick={handlePublishOnChain}
                        disabled={publishingOnChain || !deploymentAddress}
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                      >
                        {publishingOnChain ? 'Publishing...' : '📝 Publish On-Chain'}
                      </Button>
                    )}
                  </div>
                  
                  {nftResult && !deploymentAddress && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                      <p className="text-sm text-yellow-600">
                        💡 Deploy your fixed contract first to publish the audit on-chain
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}