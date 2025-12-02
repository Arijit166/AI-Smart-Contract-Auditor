"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AuditData {
  originalCode: string
  fixedCode: string
  riskScore: number
  vulnerabilities: any[]
  suggestions: string[]
  contractName: string
  timestamp: number
  merkleRoot?: string
  auditId?: string
}

interface AuditContextType {
  auditData: AuditData | null
  setAuditData: (data: AuditData | null) => void
  clearAuditData: () => void
}

const AuditContext = createContext<AuditContextType | undefined>(undefined)

export function AuditProvider({ children }: { children: ReactNode }) {
  const [auditData, setAuditDataState] = useState<AuditData | null>(null)

  const setAuditData = (data: AuditData | null) => {
    setAuditDataState(data)
    // Also save to sessionStorage for page refreshes
    if (data) {
      sessionStorage.setItem('audit-data', JSON.stringify(data))
    } else {
      sessionStorage.removeItem('audit-data')
    }
  }

  const clearAuditData = () => {
    setAuditDataState(null)
    sessionStorage.removeItem('audit-data')
  }

  // Load from sessionStorage on mount
  React.useEffect(() => {
    const stored = sessionStorage.getItem('audit-data')
    if (stored) {
      try {
        setAuditDataState(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored audit data')
      }
    }
  }, [])

  return (
    <AuditContext.Provider value={{ auditData, setAuditData, clearAuditData }}>
      {children}
    </AuditContext.Provider>
  )
}

export function useAudit() {
  const context = useContext(AuditContext)
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider')
  }
  return context
}