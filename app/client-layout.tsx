"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Analytics } from "@vercel/analytics/next"
import Sidebar from "@/components/sidebar"
import { AuthProvider, useAuth } from "@/lib/auth-context"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { account } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Conditionally render sidebar and main layout based on auth state
  const isAuthPage = pathname === "/auth"
  const isAuthenticated = account?.isConnected

  // If not authenticated and not on auth page, redirect logic handled by middleware
  // For now, show auth page or authenticated layout
  if (isAuthPage) {
    return (
      <div className="w-full">
        <main className="w-full overflow-auto">{children}</main>
      </div>
    )
  }

  // Show sidebar + main for authenticated users
  return (
    <div className="flex h-screen">
      {mounted && <Sidebar />}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <LayoutContent>{children}</LayoutContent>
      <Analytics />
    </AuthProvider>
  )
}
