"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, AlertTriangle, AlertCircle, Info, Copy, Check } from "lucide-react"

interface AuditResultsProps {
  results: {
    riskScore: number
    vulnerabilities: Array<{
      id: number
      severity: "critical" | "high" | "medium" | "low"
      title: string
      line: number
      description: string
      impact?: string
      recommendation?: string
    }>
    suggestions: string[]
    fixedCode?: string
    rawOutput?: string
  }
}

export default function AuditResults({ results }: AuditResultsProps) {
  const [expandedVuln, setExpandedVuln] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"findings" | "fixed" | "raw">("findings")
  const [copied, setCopied] = useState(false)

  const handleCopyCode = () => {
    if (results.fixedCode) {
      navigator.clipboard.writeText(results.fixedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const severityConfig = {
    critical: { color: "bg-purple-500/20 text-purple-400", icon: AlertTriangle },
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
        {[
          { id: "findings", label: "Findings" },
          { id: "fixed", label: "Auto-Fixed Code" },
          { id: "raw", label: "Raw Output" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "findings" | "fixed" | "raw")}
            className="px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px"
            style={{
              borderColor: activeTab === tab.id ? "#00d9ff" : "transparent",
              color: activeTab === tab.id ? "#00d9ff" : "#a0a0a0",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "findings" && (
        <>
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
                      {isExpanded && (
                        <div className="text-sm text-foreground/70 mt-2 space-y-2">
                          <p>{vuln.description}</p>
                          {vuln.impact && (
                            <p className="text-red-400"><strong>Impact:</strong> {vuln.impact}</p>
                          )}
                          {vuln.recommendation && (
                            <p className="text-green-400"><strong>Fix:</strong> {vuln.recommendation}</p>
                          )}
                        </div>
                      )}
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
        </>
      )}

      {activeTab === "fixed" && (
        <Card className="glass-effect border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground/60">AUTO-FIXED CODE</h3>
            {results.fixedCode && (
              <Button
                onClick={handleCopyCode}
                size="sm"
                variant="outline"
                className="flex items-center gap-2 h-8 border-border hover:bg-primary/20"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-400" />
                    <span className="text-xs">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span className="text-xs">Copy Code</span>
                  </>
                )}
              </Button>
            )}
          </div>
          {results.fixedCode ? (
            <pre className="text-xs font-mono overflow-x-auto text-foreground/80 bg-card/50 p-4 rounded">
              {results.fixedCode}
            </pre>
          ) : (
            <p className="text-foreground/60 text-sm">No fixed code available</p>
          )}
        </Card>
      )}

      {activeTab === "raw" && (
        <Card className="glass-effect border-border p-4">
          <h3 className="text-sm font-semibold text-foreground/60 mb-3">RAW ANALYSIS OUTPUT</h3>
          <pre className="text-xs font-mono overflow-x-auto text-foreground/80 bg-card/50 p-4 rounded whitespace-pre-wrap">
            {results.rawOutput || JSON.stringify(results, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  )
}