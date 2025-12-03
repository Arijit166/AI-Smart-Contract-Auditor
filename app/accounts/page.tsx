"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Trash2, HelpCircle, Settings as SettingsIcon, Upload, Edit2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useProfile } from "@/lib/profile-context"

export default function AccountsPage() {
  const { account, disconnectWallet } = useAuth()
  const { profile: contextProfile, refreshProfile } = useProfile()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"profile" | "faq">("profile")
  
  // Profile state
  const [name, setName] = useState("")
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState("")
  const [loading, setLoading] = useState(true)
  const [showNameModal, setShowNameModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  

   useEffect(() => {
    if (contextProfile) {
      setName(contextProfile.name)
      setProfilePhoto(contextProfile.profilePhoto)
      setLoading(false)
    } else if (account?.address) {
      fetchProfile()
    }
  }, [contextProfile, account?.address])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/profile?walletAddress=${account?.address}`)
      const data = await response.json()
      
      if (data.success && data.profile) {
        setName(data.profile.name)
        setProfilePhoto(data.profile.profilePhoto)
      } else {
        setShowNameModal(true)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = async (newName: string) => {
    if (!newName.trim()) return

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account?.address,
          name: newName,
        }),
      })

      if (response.ok) {
        setName(newName)
        setShowNameModal(false)
        setIsEditingName(false)
        // Trigger profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { name: newName, profilePhoto } 
        }))
      }
    } catch (error) {
      console.error('Failed to save name:', error)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      
      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: account?.address,
            name,
            profilePhoto: base64,
          }),
        })

        if (response.ok) {
          setProfilePhoto(base64)
          // Trigger profile update event
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: { name, profilePhoto: base64 } 
          }))
        }
      } catch (error) {
        console.error('Failed to upload photo:', error)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account?.address,
          name,
          profilePhoto: null,
        }),
      })

      if (response.ok) {
        setProfilePhoto(null)
        // Trigger profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { name, profilePhoto: null } 
        }))
      }
    } catch (error) {
      console.error('Failed to remove photo:', error)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`/api/profile?walletAddress=${account?.address}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await disconnectWallet()
        router.push('/auth')
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
    }
  }

  const faqs = [
    {
      question: "How does the AI smart contract auditing work?",
      answer: "Our AI analyzes your uploaded Solidity contract, detects vulnerabilities, generates fixes, and produces a cryptographically verifiable audit proof using Merkle Trees."
    },
    {
      question: "What is the Audit Proof (Merkle Tree) feature?",
      answer: "Each vulnerability, fix, and AI output is hashed independently and combined into a Merkle root stored on-chain. This proves your audit was not tampered with and ensures verifiable audit integrity."
    },
    {
      question: "How does the Vulnerability Registry work?",
      answer: "Every audit stores metadata on-chain including contract hash, issue types, severity, and fix status. Anyone can check whether a contract has been audited before and what issues were found."
    },
    {
      question: "What are NFT Audit Badges?",
      answer: "Auditors earn on-chain NFT badges such as Vulnerability Hunter, Bug Fixer, Gas Optimizer, or Level 1–5 Verified Auditor. These NFTs act as proof-of-skill and build your on-chain identity."
    },
    {
      question: "How does the Reputation Leaderboard work?",
      answer: "Auditors earn reputation for completing audits, safely deploying fixed contracts, and resolving high-risk issues. Reputation is fully on-chain, powering the public leaderboard."
    },
    {
      question: "How do subscriptions work?",
      answer: "Subscriptions unlock additional features such as more audits, faster AI analysis, priority deploys, advanced analytics, and on-chain audit proof generation depending on your chosen plan."
    },
    {
      question: "Can I deploy directly after auditing?",
      answer: "Yes, after the AI auto-fixes your contract, you can deploy it directly to supported testnets like Polygon Amoy, Celo Sepolia, and Flow Testnet. Deployment records are stored on-chain."
    },
    {
      question: "Are my contracts and audit results secure?",
      answer: "Yes. Your code, profile, and audit metadata are stored securely, and sensitive components like cryptographic proofs and registry entries are committed on-chain for tamper-proof verification."
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto ml-3 space-y-6">
        <h1 className="text-3xl font-bold text-foreground mb-8">Manage Your Account</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar */}
          <div className="lg:w-64 space-y-4">
            {/* Profile Section */}
            <Card className="glass-effect border-border p-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Profile Photo */}
                <div className="relative group">
                  {profilePhoto ? (
                    <>
                      <img 
                        src={profilePhoto} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="w-6 h-6 text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={handleRemovePhoto}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                        title="Remove photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <User className="w-12 h-12 text-primary-foreground" />
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="w-6 h-6 text-white" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoUpload} 
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>

                {/* Name */}
                <div className="text-center w-full">
                  {isEditingName ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                        placeholder="Enter your name"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveName(tempName)}
                          className="flex-1"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingName(false)
                            setTempName(name)
                          }}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2">
                        <h3 className="font-semibold text-foreground">{name}</h3>
                        <button
                          onClick={() => {
                            setTempName(name)
                            setIsEditingName(true)
                          }}
                          className="text-foreground/60 hover:text-foreground"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-foreground/60 font-mono">
                        {account?.address?.slice(0, 6)}...{account?.address?.slice(-4)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Navigation */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "profile"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-card"
                }`}
              >
                <SettingsIcon size={20} />
                <span className="font-medium">Settings</span>
              </button>
              <button
                onClick={() => setActiveTab("faq")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === "faq"
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-card"
                }`}
              >
                <HelpCircle size={20} />
                <span className="font-medium">FAQ</span>
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1">
            {activeTab === "profile" ? (
              <Card className="glass-effect border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  {/* Wallet Info */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Connected Wallet
                    </label>
                    <div className="bg-input border border-border rounded-lg px-4 py-3">
                      <p className="font-mono text-sm text-foreground">{account?.address}</p>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteModal(true)}
                      className="gap-2 border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                      Delete My Account
                    </Button>
                    <p className="text-xs text-foreground/60 mt-2">
                      This will permanently delete your account and all associated data.
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="glass-effect border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
                
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-0">
                      <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                      <p className="text-sm text-foreground/60">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Name Input Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-effect border-border p-6 max-w-md w-full space-y-4">
            <h3 className="text-xl font-bold text-foreground">Welcome! What's your name?</h3>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Enter your name"
              autoFocus
            />
            <Button
              onClick={() => handleSaveName(tempName)}
              disabled={!tempName.trim()}
              className="w-full"
            >
              Continue
            </Button>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="glass-effect border-red-500/50 border-2 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Delete Account?</h3>
            </div>
            <p className="text-foreground/80">
              This action cannot be undone. This will permanently delete your account and remove all your data including:
            </p>
            <ul className="list-disc list-inside text-sm text-foreground/60 space-y-1">
              <li>Your profile information</li>
              <li>Subscription status and billing history</li>
              <li>Audit records and vulnerability reports</li>
              <li>On-chain deployment logs</li>
              <li>Generated audit proofs and Merkle roots</li>
              <li>Vulnerability registry entries linked to your wallet</li>
              <li>NFT Audit Badges and reputation points</li>
              <li>Leaderboard rankings</li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50"
              >
                Delete Account
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}