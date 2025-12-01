"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Zap, Reply as Deploy, History, Settings, Menu, X, LogOut, Shield, Trophy, Award, Database } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const { account, disconnectWallet } = useAuth()

  const navItems = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Audit", icon: Zap, href: "/audit" },
    { label: "Deploy", icon: Deploy, href: "/deploy" },
    { label: "Registry", icon: Database, href: "/registry" },
    { label: "Verification", icon: Shield, href: "/verification" },
    { label: "Badges", icon: Award, href: "/badges" },
    { label: "Leaderboard", icon: Trophy, href: "/reputation" },
    { label: "History", icon: History, href: "/history" },
    { label: "Accounts", icon: Settings, href: "/accounts" }, 
  ]

  const isActive = (href: string) => pathname === href

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = async () => {
    await disconnectWallet()
    setShowLogoutModal(false)
    router.push("/auth")
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 md:hidden hover:bg-sidebar-accent rounded-lg transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:static md:translate-x-0 left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40 flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent glow-cyan flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" strokeWidth={3} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-primary">Auditor</h1>
              <p className="text-xs text-sidebar-accent">Smart Contracts</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground glow-cyan"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-sidebar-border space-y-3">
          {account?.isConnected && (
            <>
              <div className="bg-sidebar-accent/30 rounded-lg p-3 space-y-1">
                <p className="text-xs text-sidebar-foreground/60 font-semibold">Connected Wallet</p>
                <p className="text-xs font-mono text-sidebar-primary truncate">{account.address}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-sidebar-foreground bg-sidebar-accent/20 hover:bg-sidebar-accent/40 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          )}
          <p className="text-xs text-sidebar-foreground/40 text-center">v1.0.0</p>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsOpen(false)} />}
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-sidebar border-2 border-sidebar-border rounded-lg p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                <LogOut className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-sidebar-primary">Disconnect Wallet?</h3>
              <p className="text-sm text-sidebar-foreground/60">
                You'll need to reconnect your wallet to access the platform again.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium transition-colors border border-red-500/30"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
