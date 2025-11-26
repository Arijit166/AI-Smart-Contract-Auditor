"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Zap, Wallet, Copy, Check } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function SignInPage() {
  const router = useRouter()
  const { connectWallet, isConnecting } = useAuth()
  const [displayAddress, setDisplayAddress] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleConnectMetaMask = async () => {
    // Simulate wallet connection
    const mockAddress = "0x742d35Cc6634C0532925a3b844Bc0e7b3bA3dAbC"
    const mockChainId = 137

    setDisplayAddress(mockAddress)
    setTimeout(() => {
      connectWallet(mockAddress, mockChainId)
      // Redirect to dashboard after connection
      setTimeout(() => {
        router.push("/")
      }, 800)
    }, 1500)
  }

  const handleCopyAddress = () => {
    if (displayAddress) {
      navigator.clipboard.writeText(displayAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 h-full w-full">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent glow-cyan flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Smart Contract Auditor</h1>
          <p className="text-foreground/60">Sign in with MetaMask to get started</p>
        </div>

        {/* Main Content */}
        {!displayAddress ? (
          <Card className="glass-effect border-border p-8 space-y-6">
            {/* MetaMask Connection */}
            <div>
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Wallet size={20} className="text-primary" />
                Connect Your Wallet
              </h2>
              <button
                onClick={handleConnectMetaMask}
                disabled={isConnecting}
                className="w-full p-4 rounded-lg border-2 border-border hover:border-primary/50 bg-card hover:bg-card/80 transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🦊</span>
                  <span className="font-semibold text-foreground">MetaMask</span>
                </div>
                {isConnecting && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
              </button>
            </div>

            {/* Info */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-foreground/60 text-center">
                Connect your MetaMask wallet to audit and deploy smart contracts securely
              </p>
            </div>
          </Card>
        ) : (
          /* Connection Success */
          <Card className="glass-effect border-primary/50 border-2 p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Wallet Connected!</h2>
              <p className="text-sm text-foreground/60">Your MetaMask wallet is now connected</p>
            </div>

            {/* Connected Address Display */}
            <div className="space-y-2 bg-card p-4 rounded-lg border border-border">
              <p className="text-xs text-foreground/60 font-semibold uppercase">Connected Address</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 font-mono text-sm text-primary truncate">{displayAddress}</code>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 hover:bg-background rounded transition-colors text-foreground/60 hover:text-foreground"
                >
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                </button>
              </div>
            </div>

            {/* Redirecting Message */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-foreground/60">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                Redirecting to dashboard...
              </div>
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-foreground/40">
          <p>By signing in, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  )
}
