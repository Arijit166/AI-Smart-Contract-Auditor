"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface WalletAccount {
  address: string
  chainId: number
  isConnected: boolean
}

interface AuthContextType {
  account: WalletAccount | null
  isConnecting: boolean
  connectWallet: (address: string, chainId: number) => void
  disconnectWallet: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Load wallet from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("walletAccount")
    if (stored) {
      try {
        setAccount(JSON.parse(stored))
      } catch {
        // Ignore parsing errors
      }
    }
  }, [])

  const connectWallet = (address: string, chainId: number) => {
    setIsConnecting(true)
    // Simulate connection delay
    setTimeout(() => {
      const walletAccount = { address, chainId, isConnected: true }
      setAccount(walletAccount)
      localStorage.setItem("walletAccount", JSON.stringify(walletAccount))
      setIsConnecting(false)
    }, 500)
  }

  const disconnectWallet = () => {
    setAccount(null)
    localStorage.removeItem("walletAccount")
  }

  return (
    <AuthContext.Provider value={{ account, isConnecting, connectWallet, disconnectWallet }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
