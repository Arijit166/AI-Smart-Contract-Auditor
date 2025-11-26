"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, AlertTriangle, AlertCircle, Info } from "lucide-react"

interface AuditResultsProps {
  results: {
    riskScore: number
    vulnerabilities: Array<{
      id: number
      severity: "high" | "medium" | "low"
      title: string
      line: number
      description: string
    }>
    suggestions: string[]
  }
}

export default function AuditResults({ results }: AuditResultsProps) {
  const [expandedVuln, setExpandedVuln] = useState<number | null>(null)

  const severityConfig = {
    high: { color: "bg-red-500/20 text-red-400", icon: AlertTriangle },
    medium: { color: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
    low: { color: "bg-blue-500/20 text-blue-400", icon: Info },
  }

  const getRiskColor = () => {
    if (results.riskScore < 40) return "text-green-400"
    if (results.riskScore < 70) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="space-y-6">
      {/* Risk Score Meter */}
      <Card className="glass-effect border-border p-6">
        <h3 className="text-sm font-semibold text-foreground/60 mb-4">RISK SCORE</h3>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-background to-card border-4 border-border">
            <span className={`text-4xl font-bold ${getRiskColor()}`}>{results.riskScore}</span>
          </div>
          <div className="flex-1">
            <div className="w-full bg-border rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  results.riskScore < 40 ? "bg-green-500" : results.riskScore < 70 ? "bg-yellow-500" : "bg-red-500"
                }`}
                style={{ width: `${results.riskScore}%` }}
              />
            </div>
            <p className="text-xs text-foreground/60">
              {results.riskScore > 70
                ? "High risk - Review recommended"
                : results.riskScore > 40
                  ? "Medium risk - Address issues"
                  : "Low risk - Safe to deploy"}
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {["Findings", "Auto-Fixed Code", "Raw Output"].map((tab) => (
          <button
            key={tab}
            className="px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderColor: tab === "Findings" ? "#00d9ff" : "transparent",
              color: tab === "Findings" ? "#00d9ff" : "#a0a0a0",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Vulnerabilities List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground/60">VULNERABILITIES ({results.vulnerabilities.length})</h3>
        {results.vulnerabilities.map((vuln) => {
          const config = severityConfig[vuln.severity]
          const Icon = config.icon
          const isExpanded = expandedVuln === vuln.id

          return (
            <Card
              key={vuln.id}
              className="glass-effect border-border p-4 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setExpandedVuln(isExpanded ? null : vuln.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{vuln.title}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {vuln.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/60">Line {vuln.line}</p>
                  {isExpanded && <p className="text-sm text-foreground/70 mt-2">{vuln.description}</p>}
                </div>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
              </div>
            </Card>
          )
        })}
      </div>

      {/* Suggestions */}
      <Card className="glass-effect border-border p-4">
        <h3 className="text-sm font-semibold text-foreground/60 mb-3">IMPROVEMENT SUGGESTIONS</h3>
        <ul className="space-y-2">
          {results.suggestions.map((suggestion, i) => (
            <li key={i} className="text-sm text-foreground/70 flex gap-2">
              <span className="text-primary flex-shrink-0">✓</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
