"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, X } from "lucide-react"

interface SubscriptionRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe: () => void
  message?: string
  title?: string
}

export default function SubscriptionRequiredModal({
  isOpen,
  onClose,
  onSubscribe,
  message = "You need an active subscription to use this feature.",
  title = "Subscription Required"
}: SubscriptionRequiredModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <Card className="glass-effect border-primary/50 border-2 p-6 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-card transition-colors"
        >
          <X size={20} className="text-foreground/60" />
        </button>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center glow-cyan">
            <Crown className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-foreground/70">{message}</p>
        </div>

        {/* Benefits */}
        <div className="bg-card/50 border border-border rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground/80">With a subscription you get:</p>
          <ul className="text-sm text-foreground/60 space-y-1">
            <li>✓ Unlimited audits per month</li>
            <li>✓ Advanced vulnerability detection</li>
            <li>✓ NFT certificates & badges</li>
            <li>✓ Priority support</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-border hover:bg-card"
          >
            Maybe Later
          </Button>
          <Button
            onClick={onSubscribe}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white glow-cyan gap-2"
          >
            <Crown size={18} />
            Subscribe Now
          </Button>
        </div>
      </Card>
    </div>
  )
}