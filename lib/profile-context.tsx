"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './auth-context'

interface ProfileContextType {
  profile: { name: string; profilePhoto: string | null } | null
  loading: boolean
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { account } = useAuth()
  const [profile, setProfile] = useState<{ name: string; profilePhoto: string | null } | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchProfile = async () => {
    if (!account?.address) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/profile?walletAddress=${account.address}`)
      const data = await response.json()
      if (data.success && data.profile) {
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (account?.address) {
      fetchProfile()
    } else {
      setProfile(null)
    }
  }, [account?.address])

  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setProfile(event.detail)
    }
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}