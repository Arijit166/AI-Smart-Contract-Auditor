"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Cpu, Star, Crown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const { account } = useAuth()

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        {/* Animated background grid */}
        <div className="absolute inset-0 -z-10 h-full w-full">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="text-center mb-16">

          <div className="mb-8">
            <div className="inline-block">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 glow-cyan-sm">
                <p className="text-sm text-primary font-semibold">✨ AI-Powered Security</p>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance leading-tight">
            <span className="text-glow-cyan">AI Smart Contract</span>
            <br />
            <span className="text-foreground">Auditor</span>
          </h1>

          <p className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto mb-12 text-pretty">
            Upload a smart contract, detect vulnerabilities, generate auto-fixed code, verify Merkle-proof audit integrity, and publish on-chain.
            Earn badges, gain reputation, subscribe for advanced tools, and access the decentralized vulnerability registry.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: Shield,
              title: "Detect Vulnerabilities",
              description: "AI-powered static analysis to catch high-risk issues instantly."
            },
            {
              icon: Zap,
              title: "Auto-Fix Issues",
              description: "Automatically generate secure, upgraded versions of your contracts."
            },
            {
              icon: Cpu,
              title: "Deploy Safely",
              description: "Deploy the AI-audited version directly to testnets with one click."
            },
            {
              icon: ArrowRight,
              title: "Merkle Audit Proof",
              description: "Generate cryptographically verifiable Merkle proofs for every audit."
            },
            {
              icon: Star,
              title: "NFT Audit Badges",
              description: "Earn skill-based badges for auditing, fixing, and deploying smart contracts."
            },
            {
              icon: Crown,
              title: "Reputation & Leaderboard",
              description: "Gain on-chain audit reputation and climb the global leaderboard."
            },
            {
              icon: Zap,
              title: "Subscription Access",
              description: "Unlock advanced AI audits, faster fixes, and premium verification tools."
            },
            {
              icon: Cpu,
              title: "Vulnerability Registry",
              description: "Store audit metadata on-chain and browse verified contract security history."
            },
            {
              icon: Shield,
              title: "On-Chain Verification",
              description: "Publish audit results, fixes, and contract hashes immutably to the blockchain."
            }
          ].map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="
                  glass-effect p-6 rounded-lg border border-border transition-all duration-300 
                  hover:border-cyan-400/70 
                  hover:shadow-[0_0_20px_4px_rgba(0,200,255,0.45)]
                  hover:scale-[1.04]
                "
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-foreground/60 text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-20 pt-12 border-t border-border">
          {[
            { label: "Contracts Audited", value: "1,245" },
            { label: "Vulnerabilities Found", value: "3,892" },
            { label: "Developers Secured", value: "892" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</p>
              <p className="text-foreground/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
