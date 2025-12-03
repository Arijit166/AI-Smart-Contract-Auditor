"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Zap, Crown, Star, Loader } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ethers } from "ethers"

export default function SubscriptionPage() {
  const { account } = useAuth()
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]

  const tiers = [
    {
      id: "BASIC",
      name: "Basic",
      price: 10,
      icon: Star,
      color: "from-blue-500 to-cyan-500",
      features: [
        "10 audits per month",
        "Basic vulnerability detection",
        "Email support",
        "Access to registry"
      ]
    },
    {
      id: "PRO",
      name: "Pro",
      price: 50,
      icon: Zap,
      color: "from-purple-500 to-pink-500",
      popular: true,
      features: [
        "50 audits per month",
        "Advanced vulnerability detection",
        "Priority support",
        "NFT certificates",
        "Merkle proof verification"
      ]
    },
    {
      id: "ELITE",
      name: "Elite",
      price: 100,
      icon: Crown,
      color: "from-amber-500 to-yellow-500",
      features: [
        "Unlimited audits",
        "AI-powered recommendations",
        "24/7 dedicated support",
        "Custom badge minting",
        "Advanced analytics",
        "Team collaboration"
      ]
    }
  ]

  const contractAddresses: Record<string, { token: string, subscription: string }> = {
    'polygon-amoy': {
      token: process.env.NEXT_PUBLIC_AUDIT_TOKEN_POLYGON_AMOY || '',
      subscription: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_POLYGON_AMOY || ''
    },
    'flow-testnet': {
      token: process.env.NEXT_PUBLIC_AUDIT_TOKEN_FLOW_TESTNET || '',
      subscription: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_FLOW_TESTNET || ''
    },
    'celo-sepolia': {
      token: process.env.NEXT_PUBLIC_AUDIT_TOKEN_CELO_SEPOLIA || '',
      subscription: process.env.NEXT_PUBLIC_SUBSCRIPTION_MANAGER_CELO_SEPOLIA || ''
    }
  }

  useEffect(() => {
    if (account?.address) {
      loadSubscriptionStatus()
    }
  }, [account?.address, selectedNetwork])

  const loadSubscriptionStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/subscription/status?address=${account?.address}&network=${selectedNetwork}`)
      const data = await response.json()
      
      if (data.success && data.hasSubscription) {
        setCurrentSubscription(data.subscription)
      } else {
        setCurrentSubscription(null)
      }
    } catch (error) {
      console.error('Failed to load subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const networkChainIds: Record<string, string> = {
    'polygon-amoy': '0x13882', // 80002 in hex
    'flow-testnet': '0x221', // 545 in hex
    'celo-sepolia': '0xAA044C' // 1142220 in hex
  }

  const switchNetwork = async (networkId: string) => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: networkChainIds[networkId] }],
      })
    } catch (error: any) {
      // If network doesn't exist, try to add it
      if (error.code === 4902) {
        const networkParams: Record<string, any> = {
          'polygon-amoy': {
            chainId: '0x13882',
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
            rpcUrls: ['https://rpc-amoy.polygon.technology'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/']
          },
          'flow-testnet': {
            chainId: '0x221',
            chainName: 'Flow EVM Testnet',
            nativeCurrency: { name: 'FLOW', symbol: 'FLOW', decimals: 18 },
            rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
            blockExplorerUrls: ['https://evm-testnet.flowscan.io/']
          },
          'celo-sepolia': {
            chainId: '0xAA044C',
            chainName: 'Celo Alfajores',
            nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
            rpcUrls: ['https://forno.celo-sepolia.celo-testnet.org/'],
            blockExplorerUrls: ['https://sepolia.celoscan.io']
          }
        }
        
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkParams[networkId]],
          })
        } catch (addError: any) {
          // If it fails because network already exists with different RPC, just switch
          if (addError.code === -32603 || addError.message?.includes('same RPC endpoint')) {
            // Network exists, try switching again
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: networkChainIds[networkId] }],
            })
          } else {
            throw addError
          }
        }
      } else if (error.code === 4001) {
        // User rejected
        throw new Error('Please switch to the correct network to continue')
      } else {
        throw error
      }
    }
  }

  const handleSubscribe = async (tier: string, price: number) => {
    if (!account?.address) {
      alert('Please connect your wallet')
      return
    }

    setSubscribing(tier)
    try {
      // Switch to the selected network first
      await switchNetwork(selectedNetwork)

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      const addresses = contractAddresses[selectedNetwork]
      
      if (!addresses.token || !addresses.subscription) {
        throw new Error(`Contract addresses not configured for ${selectedNetwork}`)
      }

      const amount = ethers.parseEther(price.toString())

      // Approve token spending
      const tokenContract = new ethers.Contract(
        addresses.token,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer
      )

      const approveTx = await tokenContract.approve(addresses.subscription, amount)
      await approveTx.wait()

      // Subscribe
      const subscriptionContract = new ethers.Contract(
        addresses.subscription,
        ["function subscribe(uint256 tier)"],
        signer
      )

      const tierIndex = tier === 'BASIC' ? 1 : tier === 'PRO' ? 2 : 3
      const subscribeTx = await subscriptionContract.subscribe(tierIndex)
      const receipt = await subscribeTx.wait()

      // Save to database
      const response = await fetch('/api/subscription/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account.address,
          tier,
          network: selectedNetwork,
          transactionHash: receipt.hash
        })
      })

      const data = await response.json()
      if (data.success) {
        alert('Subscription successful!')
        await loadSubscriptionStatus()
      } else {
        throw new Error(data.error || 'Failed to save subscription')
      }
    } catch (error: any) {
      console.error('Subscription error:', error)
      alert('Subscription failed: ' + (error.message || 'Unknown error'))
    } finally {
      setSubscribing(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Subscription Plans</h1>
          <p className="text-foreground/60">Choose the plan that fits your needs</p>

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

          {currentSubscription && (
            <Card className="glass-effect border-primary/50 border-2 p-4 max-w-md mx-auto">
              <p className="text-sm text-foreground/60">Current Plan</p>
              <p className="text-2xl font-bold text-primary">{currentSubscription.tier}</p>
              <p className="text-xs text-foreground/60">
                Expires: {new Date(currentSubscription.expiry).toLocaleDateString()}
              </p>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const Icon = tier.icon
            const isSubscribing = subscribing === tier.id

            return (
              <Card
                key={tier.id}
                className={`glass-effect p-8 relative flex flex-col ${
                  tier.popular ? 'border-primary/50 border-2' : 'border-border'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-xs font-bold text-white">
                    POPULAR
                  </div>
                )}

                <div className="text-center space-y-4 flex-grow flex flex-col">
                  <div className={`w-16 h-16 mx-auto rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{tier.name}</h3>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-primary">{tier.price}</span>
                      <span className="text-foreground/60 text-sm">AUDIT/month</span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-left flex-grow">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                        <Check size={16} className="text-primary shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(tier.id, tier.price)}
                    disabled={isSubscribing || !account?.isConnected || currentSubscription?.tier === tier.id}
                    className="w-full bg-primary hover:bg-primary/90 gap-2 mt-4"
                  >
                    {isSubscribing ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : currentSubscription?.tier === tier.id ? (
                      'Current Plan'
                    ) : (
                      'Subscribe Now'
                    )}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}