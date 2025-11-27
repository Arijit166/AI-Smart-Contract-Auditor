"use client"

import { User, Bell, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function TopNavbar() {
  const { account } = useAuth()
  const pathname = usePathname()
  const [showNotifications, setShowNotifications] = useState(false)

  // Get page title based on pathname
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
      case "/dashboard":
        return account ? `Welcome back!  ${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Welcome back!"
      case "/audit":
        return "Smart Contract Audit"
      case "/deploy":
        return "Deploy Contract"
      case "/history":
        return "Audit History"
      case "/settings":
        return "Settings"
      default:
        return "Smart Contract Auditor"
    }
  }

  const pageTitle = getPageTitle()

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-[rgba(15,70,85,0.9)] backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left Side - Dynamic Page Title */}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            {pageTitle}
          </h2>
        </div>

        {/* Right Side - User Profile & Actions */}
        <div className="flex items-center gap-3">

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan-sm cursor-pointer hover:scale-105 transition-transform">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  )
}