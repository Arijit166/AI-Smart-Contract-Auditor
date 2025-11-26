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
  connectWallet: (address: string, chainId: number) => Promise<void>
  disconnectWallet: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<WalletAccount | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/verify')
      if (response.ok) {
        const data = await response.json()
        if (data.authenticated) {
          setAccount({
            address: data.walletAddress,
            chainId: data.chainId,
            isConnected: true
          })
        }
      }
    } catch (error) {
      console.error('Session check failed:', error)
    }
  }

  const connectWallet = async (address: string, chainId: number) => {
    setIsConnecting(true)
    try {
      // Call backend API to authenticate
      const response = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: address, 
          chainId,
          signature: 'mock-signature' // In production, sign a message with MetaMask
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAccount({ 
          address: data.walletAddress, 
          chainId: data.chainId, 
          isConnected: true 
        })
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error) {
      console.error('Connect wallet error:', error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      await fetch('/api/auth/disconnect', { method: 'POST' })
      setAccount(null)
    } catch (error) {
      console.error('Disconnect error:', error)
    }
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