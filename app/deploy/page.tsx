"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Copy, ExternalLink, Zap, AlertCircle, Loader } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { compileContract } from "@/lib/services/compiler"
import { deployContractWithUserWallet, getNetworkInfo } from "@/lib/services/frontendDeployer"
import { useAudit } from "@/lib/audit-context"
import { updateReputation } from "@/lib/services/reputation-service"

export default function DeployPage() {
  const { account } = useAuth()
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")
  const [deploymentAddress, setDeploymentAddress] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [gasUsed, setGasUsed] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contractCode, setContractCode] = useState("")
  const [showCodeInput, setShowCodeInput] = useState(true)
  const [mintingNFT, setMintingNFT] = useState(false)
  const [publishingOnChain, setPublishingOnChain] = useState(false)
  const [nftResult, setNftResult] = useState<any>(null)
  const [publishResult, setPublishResult] = useState<any>(null)
  const { auditData } = useAudit()

  const networks = [
  { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
  { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
  { id: "celo-sepolia", name: "Celo sepolia", icon: "🟡" },
]

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeploy = async () => {
    if (!contractCode.trim()) {
      setError("Please enter contract code")
      return
    }

    if (!account?.isConnected || !account?.address) {
      setError("Please connect your wallet first")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Compile contract
      console.log('🔵 [Deploy Page] Step 1: Compiling...')
      const compilationResult = await compileContract({
        contractCode,
        network: selectedNetwork,
      })

      if (!compilationResult.success) {
        setError(compilationResult.error || "Compilation failed")
        setLoading(false)
        return
      }

      console.log('✅ [Deploy Page] Compilation success')

      // Step 2: Deploy using user's wallet
      console.log('🔵 [Deploy Page] Step 2: Deploying...')
      const deploymentResult = await deployContractWithUserWallet(
        selectedNetwork,
        compilationResult.bytecode!,
        compilationResult.abi!
      )

      if (!deploymentResult.success) {
        setError(deploymentResult.error || "Deployment failed")
        setLoading(false)
        return
      }

      console.log('✅ [Deploy Page] Deployment success')

      // Step 3: Save to database
      console.log('🔵 [Deploy Page] Step 3: Saving to database...')
      const response = await fetch("/api/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractCode,
          network: selectedNetwork,
          userAddress: account.address,
          contractAddress: deploymentResult.contractAddress,
          transactionHash: deploymentResult.transactionHash,
          gasUsed: deploymentResult.gasUsed,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        console.warn('⚠️ [Deploy Page] Database save failed (non-critical):', data.error)
      } else {
        console.log('✅ [Deploy Page] Saved to database')
      }

      // Set results
      setDeploymentAddress(deploymentResult.contractAddress!)
      setTransactionHash(deploymentResult.transactionHash || null)
      setGasUsed(deploymentResult.gasUsed || null)
      setShowCodeInput(false)
      if (account?.address) {
        await updateReputation('deployment', account.address, selectedNetwork)
      }
    } catch (err: any) {
      setError(err.message || "Deployment error")
    } finally {
      setLoading(false)
    }
  }

  const resetDeployment = () => {
    setDeploymentAddress(null)
    setTransactionHash(null)
    setGasUsed(null)
    setContractCode("")
    setShowCodeInput(true)
    setError(null)
  }

  const getExplorerLink = () => {
    if (!deploymentAddress) return null
    
    const explorers: Record<string, string> = {
      'polygon-amoy': 'https://amoy.polygonscan.com/address/',
      'flow-testnet': 'https://evm-testnet.flowscan.io/address/',
      'celo-sepolia': 'https://forno.celo-sepolia.celo-testnet.org/address/',
    }
    
    return explorers[selectedNetwork] + deploymentAddress
  }

  const getNetworkExplorerTxLink = () => {
    if (!transactionHash) return null
    
    const explorers: Record<string, string> = {
    'polygon-amoy': 'https://amoy.polygonscan.com/tx/',
    'flow-testnet': 'https://evm-testnet.flowscan.io/tx/',
    'celo-sepolia': 'https://forno.celo-sepolia.celo-testnet.org/tx/',
  }
    
    return explorers[selectedNetwork] + transactionHash
  }

  const handleMintNFT = async () => {
    if (!auditData || !account?.address || !deploymentAddress) {
      setError("Please complete audit and deployment first")
      return
    }

    setMintingNFT(true)
    setError(null)

    try {
      const payload = {
        network: selectedNetwork,
        userAddress: account.address,
        originalCode: auditData.originalCode,
        fixedCode: auditData.fixedCode,
        auditData: {
          riskScore: auditData.riskScore,
          vulnerabilities: auditData.vulnerabilities,
          suggestions: auditData.suggestions || [],
        },
      }
      
      const response = await fetch('/api/onchain/mint-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (data.success) {
        setNftResult(data)
        setError(null)
      } else {
        setError('Failed to mint NFT: ' + data.error)
      }
    } catch (err: any) {
      setError('Mint NFT error: ' + err.message)
    } finally {
      setMintingNFT(false)
    }
  }

  const handlePublishOnChain = async () => {
    if (!nftResult || !deploymentAddress || !auditData) {
      setError('Please mint NFT certificate first')
      return
    }

    setPublishingOnChain(true)
    setError(null)

    try {
      // ✅ Calculate proper bytes32 hashes from the actual code
      const { ethers } = await import('ethers')
      const originalCodeHash = ethers.keccak256(ethers.toUtf8Bytes(auditData.originalCode))
      const fixedCodeHash = ethers.keccak256(ethers.toUtf8Bytes(auditData.fixedCode))

      const response = await fetch('/api/onchain/publish-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network: selectedNetwork,
          contractAddress: deploymentAddress,
          originalCodeHash: originalCodeHash,  
          fixedCodeHash: fixedCodeHash,        
          riskScore: auditData.riskScore,
          ipfsPdfCID: nftResult.ipfs.pdfCID,
          ipfsCodeCID: nftResult.ipfs.fixedCodeCID,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setPublishResult(data)
        setError(null)
      } else {
        setError('Failed to publish: ' + data.error)
      }
    } catch (err: any) {
      setError('Publish error: ' + err.message)
    } finally {
      setPublishingOnChain(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto ml-12 space-y-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground pl-70">Deploy Contract</h1>
            <p className="text-foreground/60 pl-30">Compile and deploy your auto-fixed Solidity contract to testnet using your wallet</p>
          </div>

          {error && (
            <Card className="border-red-500/50 bg-red-500/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-red-500">Error</h3>
                  <p className="text-sm text-red-500/80">{error}</p>
                </div>
              </div>
            </Card>
          )}

          {!account?.isConnected && (
            <Card className="border-yellow-500/50 bg-yellow-500/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-semibold text-yellow-600">Connect Wallet</h3>
                  <p className="text-sm text-yellow-600/80">Please connect your wallet to deploy contracts</p>
                </div>
              </div>
            </Card>
          )}

          {showCodeInput && !deploymentAddress ? (
            <>
              {/* Contract Code Input */}
              <Card className="glass-effect border-border overflow-hidden">
                <div className="bg-card border-b border-border p-4">
                  <h2 className="font-semibold text-foreground">Paste Solidity Code</h2>
                </div>
                <div className="p-6">
                  <textarea
                    value={contractCode}
                    onChange={(e) => setContractCode(e.target.value)}
                    placeholder="// Paste your auto-fixed Solidity contract code here..."
                    className="w-full h-64 bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </Card>

              {/* Network Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-foreground">Select Network</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {networks.map((network) => (
                    <button
                      key={network.id}
                      onClick={() => setSelectedNetwork(network.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedNetwork === network.id
                          ? "border-primary bg-primary/10 glow-cyan"
                          : "border-border hover:border-primary/50 bg-card"
                      }`}
                    >
                      <span className="text-2xl mr-2">{network.icon}</span>
                      <p className="font-semibold text-foreground">{network.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Deploy Button */}
              <Button
                onClick={handleDeploy}
                disabled={loading || !contractCode.trim() || !account?.isConnected}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all hover:scale-105 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Zap size={20} />
                    Deploy to {networks.find((n) => n.id === selectedNetwork)?.name}
                  </>
                )}
              </Button>
            </>
          ) : deploymentAddress ? (
            <Card className="glass-effect border-primary/50 border-2 p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Check size={24} />
                <h3 className="text-xl font-bold">Deployment Successful! 🎉</h3>
              </div>

              {/* Contract Address */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Contract Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={deploymentAddress}
                    className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm focus:outline-none"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopyAddress(deploymentAddress)}
                    className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Copy size={16} />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  {getExplorerLink() && (
                    <a
                      href={getExplorerLink()!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                    >
                      <ExternalLink size={16} className="text-primary" />
                    </a>
                  )}
                </div>
              </div>

              {/* Transaction Hash */}
              {transactionHash && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Transaction Hash</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={transactionHash}
                      className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm"
                    />
                    {getNetworkExplorerTxLink() && (
                      <a
                        href={getNetworkExplorerTxLink()!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink size={16} className="text-primary" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Gas Used */}
              {gasUsed && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">Gas Used</label>
                  <input
                    type="text"
                    readOnly
                    value={gasUsed}
                    className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm"
                  />
                </div>
              )}

              {/* Network Info */}
              <div className="pt-4 border-t border-border text-sm text-foreground/60 space-y-2">
                <p>Network: <span className="text-primary font-semibold">{networks.find((n) => n.id === selectedNetwork)?.name}</span></p>
                <p>Status: <span className="text-primary font-semibold">Confirmed ✓</span></p>
              </div>

              {/* Deploy New Button */}
              <Button
                onClick={resetDeployment}
                variant="outline"
                className="w-full gap-2 border-border hover:bg-card"
              >
                <Zap size={20} />
                Deploy Another Contract
              </Button>
              {/* NFT & On-Chain Publishing Section */}
              {auditData && (
                <div className="pt-4 border-t border-border space-y-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Certificate & On-Chain Publishing</h3>
                    <p className="text-sm text-foreground/60">
                      Mint an NFT certificate and publish audit results on-chain
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleMintNFT}
                      disabled={mintingNFT || !account?.isConnected || nftResult !== null}
                      className="w-full bg-purple-500 hover:bg-purple-600 gap-2"
                      size="lg"
                    >
                      {mintingNFT ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Minting NFT...
                        </>
                      ) : nftResult ? (
                        <>
                          <Check size={20} />
                          NFT Minted ✓
                        </>
                      ) : (
                        <>🎨 Mint NFT Certificate</>
                      )}
                    </Button>

                    {nftResult && (
                      <Button
                        onClick={handlePublishOnChain}
                        disabled={publishingOnChain || publishResult !== null}
                        className="w-full bg-blue-500 hover:bg-blue-600 gap-2"
                        size="lg"
                      >
                        {publishingOnChain ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            Publishing...
                          </>
                        ) : publishResult ? (
                          <>
                            <Check size={20} />
                            Published On-Chain ✓
                          </>
                        ) : (
                          <>📝 Publish Audit On-Chain</>
                        )}
                      </Button>
                    )}
                  </div>

                  {!auditData && (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
                      <p className="text-sm text-yellow-600">
                        ⚠️ Please complete an audit first before minting NFT
                      </p>
                    </div>
                  )}

                  {nftResult && (
                    <div className="pt-4 border-t border-border space-y-2 text-sm">
                      <p className="text-foreground/60">
                        NFT Token ID: <span className="text-primary font-mono">{nftResult.tokenId}</span>
                      </p>
                      <p className="text-foreground/60">
                        IPFS Metadata:{" "}
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${nftResult.ipfs.metadataCID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          View on IPFS
                        </a>
                      </p>
                    </div>
                  )}

                  {publishResult && (
                    <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                      <p className="text-green-600 font-semibold">✓ Audit Successfully Published On-Chain</p>
                      <p className="text-sm text-green-600/80 mt-1">
                        Transaction:{" "}
                        <a
                          href={getNetworkExplorerTxLink() || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {publishResult.transactionHash?.slice(0, 10)}...
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  )
}