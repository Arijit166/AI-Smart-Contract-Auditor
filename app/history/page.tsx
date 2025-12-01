"use client"

import jsPDF from 'jspdf'
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Loader, Receipt } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export default function HistoryPage() {
  const { account } = useAuth()
  const [audits, setAudits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [auditDetails, setAuditDetails] = useState<{ [key: string]: any }>({})
  const [selectedNetwork, setSelectedNetwork] = useState("polygon-amoy")

  const networks = [
    { id: "polygon-amoy", name: "Polygon Amoy", icon: "🟣" },
    { id: "flow-testnet", name: "Flow Testnet", icon: "💚" },
    { id: "celo-sepolia", name: "Celo Sepolia", icon: "🟡" },
  ]

  useEffect(() => {
    if (account?.address) {
      fetchHistory()
    }
  }, [account?.address, selectedNetwork])

  const fetchHistory = async () => {
    try {
      const response = await fetch(
        `/api/audit/history?userAddress=${account?.address}&network=${selectedNetwork}`
      )
      const data = await response.json()
      if (data.success) {
        setAudits(data.audits)
      }
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (score: number) => {
    if (score < 40) return "bg-green-500/20 text-green-400"
    if (score < 70) return "bg-yellow-500/20 text-yellow-400"
    return "bg-red-500/20 text-red-400"
  }

  const getExplorerLink = (network: string, address: string) => {
    const explorers: Record<string, string> = {
      'polygon-amoy': 'https://amoy.polygonscan.com/address/',
      'flow-testnet': 'https://evm-testnet.flowscan.io/address/',
      'celo-sepolia': 'https://alfajores.celoscan.io/address/',
    }
    return explorers[network] + address
  }

  const getTransactionLink = (network: string, txHash: string) => {
    const explorers: Record<string, string> = {
      'polygon-amoy': 'https://amoy.polygonscan.com/tx/',
      'flow-testnet': 'https://evm-testnet.flowscan.io/tx/',
      'celo-sepolia': 'https://alfajores.celoscan.io/tx/',
    }
    return explorers[network] + txHash
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleDownloadPDF = async (audit: any) => {
    // Check if we already have the details
    if (!auditDetails[audit.id]) {
      try {
        const response = await fetch(
          `/api/audit/details?auditId=${audit.id}&userAddress=${account?.address}`
        )
        const data = await response.json()
        if (data.success) {
          setAuditDetails(prev => ({
            ...prev,
            [audit.id]: data.audit
          }))
          // Export after setting details
          setTimeout(() => exportToPDF(audit, data.audit), 100)
          return
        }
      } catch (error) {
        console.error('Failed to fetch audit details:', error)
      }
    } else {
      // Already have details, export directly
      exportToPDF(audit, auditDetails[audit.id])
    }
  }

  const exportToPDF = (audit: any, details: any) => {
    const doc = new jsPDF()
    let yPosition = 20
    
    // Title
    doc.setFontSize(20)
    doc.text('Audit Report', 20, yPosition)
    yPosition += 15
    
    // Basic Info
    doc.setFontSize(12)
    doc.text(`Contract: ${audit.name}`, 20, yPosition)
    yPosition += 7
    doc.text(`Date: ${audit.date}`, 20, yPosition)
    yPosition += 7
    doc.text(`Status: ${audit.status}`, 20, yPosition)
    yPosition += 7
    doc.text(`Risk Score: ${audit.riskScore}%`, 20, yPosition)
    yPosition += 7
    
    if (audit.address) {
      doc.text(`Contract Address: ${audit.address}`, 20, yPosition)
      yPosition += 7
      doc.text(`Network: ${audit.network}`, 20, yPosition)
      yPosition += 7
    }
    
    // Vulnerabilities Section
    if (details?.vulnerabilities && details.vulnerabilities.length > 0) {
      yPosition += 10
      doc.setFontSize(14)
      doc.text('Vulnerabilities', 20, yPosition)
      yPosition += 10
      
      doc.setFontSize(11)
      details.vulnerabilities.forEach((vuln: any, index: number) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        
        // Vulnerability title and severity
        doc.setTextColor(200, 50, 50)
        doc.text(`${index + 1}. ${vuln.title} [${vuln.severity.toUpperCase()}]`, 20, yPosition)
        doc.setTextColor(0, 0, 0)
        yPosition += 7
        
        // Line number
        doc.setFontSize(10)
        doc.text(`Line: ${vuln.line}`, 25, yPosition)
        yPosition += 6
        
        // Description
        const descLines = doc.splitTextToSize(`Description: ${vuln.description}`, 170)
        doc.text(descLines, 25, yPosition)
        yPosition += descLines.length * 5 + 2
        
        // Impact
        if (vuln.impact) {
          const impactLines = doc.splitTextToSize(`Impact: ${vuln.impact}`, 170)
          doc.setTextColor(200, 0, 0)
          doc.text(impactLines, 25, yPosition)
          doc.setTextColor(0, 0, 0)
          yPosition += impactLines.length * 5 + 2
        }
        
        // Recommendation
        if (vuln.recommendation) {
          const recLines = doc.splitTextToSize(`Recommendation: ${vuln.recommendation}`, 170)
          doc.setTextColor(0, 150, 0)
          doc.text(recLines, 25, yPosition)
          doc.setTextColor(0, 0, 0)
          yPosition += recLines.length * 5 + 5
        }
        
        doc.setFontSize(11)
      })
    }
    
    doc.save(`${audit.name}_audit_report.pdf`)
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-4xl mx-auto ml-12 space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground pl-65">Audit & Deployment History</h1>
          <p className="text-foreground/60 mt-1 pl-74">View all your previous audits and deployments</p>
        </div>
        <div className="flex gap-3 mb-6 pl-55">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedNetwork === network.id
                  ? "border-primary bg-primary/10 glow-cyan"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <span className="mr-2">{network.icon}</span>
              <span className="text-sm font-semibold">{network.name}</span>
            </button>
          ))}
        </div>
        {audits.length === 0 ? (
          <Card className="glass-effect border-border p-8 text-center pl-50">
            <p className="text-foreground/60">No history yet. Start by auditing a contract!</p>
          </Card>
        ) : (
          <div className="space-y-4">
              {audits.map((audit) => (
              <Card key={audit.id} className="glass-effect border-border p-6 hover:border-primary/50 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground">{audit.name}</h3>
                      <Badge variant={audit.status === "Deployed" ? "default" : "secondary"}>
                        {audit.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/60 mb-3">{audit.date}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {audit.riskScore > 0 && (
                        <>
                          <div>
                            <span className="text-foreground/60">Risk Score: </span>
                            <span className={`font-semibold ${getSeverityColor(audit.riskScore).split(" ")[0].replace("bg-", "text-")}`}>
                              {audit.riskScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-foreground/60">Vulnerabilities: </span>
                            <span className="font-semibold text-foreground">{audit.vulnerabilities}</span>
                          </div>
                        </>
                      )}
                      {audit.address && (
                        <>
                          <div>
                            <span className="text-foreground/60">Contract: </span>
                            <span className="font-mono text-primary">{audit.address.substring(0, 10)}...</span>
                          </div>
                          <div>
                            <span className="text-foreground/60">Network: </span>
                            <span className="font-semibold text-foreground">{audit.network}</span>
                          </div>
                        </>
                      )}
                      {audit.gasUsed && (
                        <div>
                          <span className="text-foreground/60">Gas: </span>
                          <span className="font-semibold text-foreground">{audit.gasUsed}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {audit.riskScore > 0 && (
                      <button 
                        onClick={() => handleDownloadPDF(audit)}
                        className="p-2 rounded-lg bg-card hover:bg-muted transition-colors text-foreground/60 hover:text-foreground"
                        title="Download Audit Report"
                      >
                        <Download size={20} />
                      </button>
                    )}
                    {audit.address && (
                      <a
                        href={getExplorerLink(audit.network, audit.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-card hover:bg-muted transition-colors text-foreground/60 hover:text-foreground"
                        title="View Contract"
                      >
                        <ExternalLink size={20} />
                      </a>
                    )}

                    {audit.transactionHash && (
                      <a
                        href={getTransactionLink(audit.network, audit.transactionHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
                        title="View Transaction"
                      >
                        <Receipt size={20} />  
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}