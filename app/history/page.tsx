"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink } from "lucide-react"

export default function HistoryPage() {
  const audits = [
    {
      id: 1,
      name: "TokenVault.sol",
      date: "Nov 25, 2024",
      status: "Deployed",
      riskScore: 45,
      vulnerabilities: 2,
      address: "0x742d...",
    },
    {
      id: 2,
      name: "LiquidityPool.sol",
      date: "Nov 23, 2024",
      status: "Audited",
      riskScore: 68,
      vulnerabilities: 5,
      address: null,
    },
    {
      id: 3,
      name: "GovernanceDAO.sol",
      date: "Nov 20, 2024",
      status: "Deployed",
      riskScore: 32,
      vulnerabilities: 1,
      address: "0x8f1d...",
    },
  ]

  const getSeverityColor = (score: number) => {
    if (score < 40) return "bg-green-500/20 text-green-400"
    if (score < 70) return "bg-yellow-500/20 text-yellow-400"
    return "bg-red-500/20 text-red-400"
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Audit History</h1>
          <p className="text-foreground/60">View all your previous audits and deployments</p>
        </div>

        <div className="space-y-4">
          {audits.map((audit) => (
            <Card key={audit.id} className="glass-effect border-border p-6 hover:border-primary/50 transition-all">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-foreground">{audit.name}</h3>
                    <Badge variant={audit.status === "Deployed" ? "default" : "secondary"}>{audit.status}</Badge>
                  </div>
                  <p className="text-sm text-foreground/60 mb-3">{audit.date}</p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-foreground/60">Risk Score: </span>
                      <span
                        className={`font-semibold ${getSeverityColor(audit.riskScore).split(" ")[0].replace("bg-", "text-")}`}
                      >
                        {audit.riskScore}%
                      </span>
                    </div>
                    <div>
                      <span className="text-foreground/60">Vulnerabilities: </span>
                      <span className="font-semibold text-foreground">{audit.vulnerabilities}</span>
                    </div>
                    {audit.address && <div className="font-mono text-primary">{audit.address}</div>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-card hover:bg-muted transition-colors text-foreground/60 hover:text-foreground">
                    <Download size={20} />
                  </button>
                  {audit.address && (
                    <button className="p-2 rounded-lg bg-card hover:bg-muted transition-colors text-foreground/60 hover:text-foreground">
                      <ExternalLink size={20} />
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
