"use client"

import { User } from "lucide-react"
import { useProfile } from "@/lib/profile-context"

export default function TopNavbar() {
  const { profile, loading } = useProfile()

  const getPageTitle = () => {
    if (profile?.name) {
      return `Welcome back, ${profile.name}!`
    }
    return "Welcome back!"
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-[rgba(15,70,85,0.9)] backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">
            {getPageTitle()}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 pl-3 border-l border-border">
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            ) : profile?.profilePhoto ? (
              <img 
                src={profile.profilePhoto} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-cyan-sm cursor-pointer hover:scale-105 transition-transform">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}