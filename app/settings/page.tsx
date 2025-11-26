"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Shield, Zap } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-foreground/60">Manage your preferences and configuration</p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card className="glass-effect border-border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Notifications</h3>
                <p className="text-sm text-foreground/60 mb-4">
                  Get alerts when audits complete or vulnerabilities are found
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-sm text-foreground">Email notifications</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                    <span className="text-sm text-foreground">High severity alerts</span>
                  </label>
                </div>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="glass-effect border-border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Security</h3>
                <p className="text-sm text-foreground/60 mb-4">Your data is encrypted and stored securely</p>
                <Button variant="outline" className="border-border hover:bg-card bg-transparent">
                  Change Password
                </Button>
              </div>
            </div>
          </Card>

          {/* API */}
          <Card className="glass-effect border-border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">API Access</h3>
                <p className="text-sm text-foreground/60 mb-4">Integrate the auditor into your workflow</p>
                <Button variant="outline" className="border-border hover:bg-card bg-transparent">
                  Generate API Key
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
