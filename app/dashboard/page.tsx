"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Cpu } from "lucide-react"
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
          {account && (
            <div className="mb-8 px-4 py-3 rounded-lg bg-primary/10 border border-primary/30 inline-block">
              <p className="text-sm text-primary font-semibold">
                Welcome back! Connected to {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </p>
            </div>
          )}

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
            Upload a Solidity file, detect vulnerabilities, auto-fix issues, and deploy the safe version instantly.
            Built for security engineers.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center mb-16">
            <Link href="/audit">
              <Button
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all hover:scale-105"
              >
                Start Audit <ArrowRight size={20} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: Shield,
              title: "Detect Vulnerabilities",
              description: "AI-powered analysis to find security issues in your smart contracts",
            },
            {
              icon: Zap,
              title: "Auto-Fix Issues",
              description: "Automatically suggest and implement fixes for detected vulnerabilities",
            },
            {
              icon: Cpu,
              title: "Deploy Safely",
              description: "Deploy to testnet with confidence using your audited contracts",
            },
          ].map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="glass-effect p-6 rounded-lg border border-border hover:border-primary/50 transition-all hover:glow-cyan-sm"
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
