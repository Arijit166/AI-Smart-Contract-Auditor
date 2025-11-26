"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Copy, Download, Zap } from "lucide-react"

export default function DeployPage() {
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")
  const [deploymentAddress, setDeploymentAddress] = useState(null)
  const [copied, setCopied] = useState(false)

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "ethereum-sepolia", name: "Ethereum Sepolia", icon: "⟠" },
    { id: "arbitrum-sep", name: "Arbitrum Sepolia", icon: "🔵" },
  ]

  const fixedContract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureVault {
  // Fixed: Added access control
  address private owner;
  
  mapping(address => uint256) private balances;
  
  event Deposit(address indexed user, uint256 amount);
  
  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner");
    _;
  }
  
  constructor() {
    owner = msg.sender;
  }
  
  function deposit() external payable {
    require(msg.value > 0, "Invalid amount");
    balances[msg.sender] += msg.value;
    emit Deposit(msg.sender, msg.value);
  }
  
  function withdraw(uint256 amount) external {
    require(balances[msg.sender] >= amount, "Insufficient balance");
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Transfer failed");
    balances[msg.sender] -= amount;
  }
}`

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x742d35Cc6634C0532925a3b844Bc0e7b3bA3dAbC")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDeploy = () => {
    setTimeout(() => {
      setDeploymentAddress("0x742d35Cc6634C0532925a3b844Bc0e7b3bA3dAbC")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">

        <div className="space-y-6">
          {/* Fixed Contract Display */}
          <Card className="glass-effect border-border overflow-hidden">
            <div className="bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Auto-Fixed Contract</h2>
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="p-6 overflow-x-auto code-highlight">
              <pre className="font-mono text-sm text-foreground/80 leading-relaxed">
                <code>{fixedContract}</code>
              </pre>
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
          {!deploymentAddress ? (
            <Button
              onClick={handleDeploy}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all hover:scale-105 gap-2"
              size="lg"
            >
              <Zap size={20} />
              Deploy to {networks.find((n) => n.id === selectedNetwork)?.name}
            </Button>
          ) : (
            <Card className="glass-effect border-primary/50 border-2 p-6 space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Check size={24} />
                <h3 className="text-xl font-bold">Deployment Successful!</h3>
              </div>

              {/* Contract Address */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground">Contract Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={deploymentAddress}
                    className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    onClick={handleCopyAddress}
                    className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Copy size={16} />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* Download Report */}
              <Button variant="outline" className="w-full gap-2 border-border hover:bg-card bg-transparent">
                <Download size={20} />
                Download Audit Report (PDF)
              </Button>

              {/* Network Info */}
              <div className="pt-4 border-t border-border text-sm text-foreground/60">
                <p>Network: {networks.find((n) => n.id === selectedNetwork)?.name}</p>
                <p>
                  Status: <span className="text-primary">Confirmed</span>
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
