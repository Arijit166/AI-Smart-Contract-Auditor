"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CodeEditor from "@/components/code-editor"
import AuditResults from "@/components/audit-results"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useAudit } from "@/lib/audit-context"
import { useRouter } from "next/navigation"

export default function AuditPage() {
  const { account } = useAuth()
  const { setAuditData } = useAudit()
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResults, setAuditResults] = useState(null)
  const [fileUploaded, setFileUploaded] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.name.endsWith(".sol")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCode(event.target?.result as string)
        setFileUploaded(true)
      }
      reader.readAsText(file)
    } else {
      alert("Please upload a .sol file")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleRunAudit = async () => {
    if (!code.trim()) {
      alert("Please provide code to audit")
      return
    }
    
    setIsAuditing(true)
    setAuditResults(null)
    
    try {
      // Run audit
      const response = await fetch("http://localhost:8000/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      })
      
      if (!response.ok) {
        throw new Error("Audit failed")
      }
      
      const data = await response.json()
      
      const auditResultsData = {
        ...data.audit,
        rawOutput: JSON.stringify(data, null, 2)
      }
      setAuditResults(auditResultsData)

      // ✅ SAVE AUDIT DATA TO CONTEXT
      const dataToSave = {
        originalCode: code,
        fixedCode: data.audit.fixedCode || code,
        riskScore: data.audit.riskScore || 0,
        vulnerabilities: data.audit.vulnerabilities || [],
        suggestions: data.audit.suggestions || [], // This should have data
        contractName: data.audit.contractName || 'Contract',
        timestamp: Date.now()
      }
      
      setAuditData(dataToSave)

      // Save to database
      if (account?.address) {
        await fetch("/api/audit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contractCode: code,
            userAddress: account.address,
            auditResults: data.audit,
          }),
        })
      }
    } catch (error) {
      console.error("Audit error:", error)
      alert("Audit failed. Please check if the backend is running.")
    } finally {
      setIsAuditing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 pl-85">Smart Contract Audit</h1>
          <p className="text-foreground/60 pl-78">Upload and analyze your Solidity contracts for vulnerabilities</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Upload & Code Editor */}
          <div className="space-y-6">
            {/* File Upload Box */}
            <Card
              className="glass-effect border-border hover:border-primary/50 transition-all p-8 text-center cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".sol"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:glow-cyan transition-all">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Drag & drop your .sol file</p>
                  <p className="text-sm text-foreground/60">or click to browse</p>
                </div>
                {fileUploaded && (
                  <div className="flex items-center gap-2 text-primary">
                    <FileText size={16} />
                    <span className="text-sm">File loaded successfully</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Code Editor */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-foreground">Solidity Code</label>
              <CodeEditor value={code} onChange={setCode} />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleRunAudit}
                disabled={!code || isAuditing}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground glow-cyan transition-all hover:scale-105"
              >
                {isAuditing ? "Auditing..." : "Run Audit"}
              </Button>
              <Button variant="outline" onClick={() => setCode("")} className="border-border hover:bg-card">
                Clear
              </Button>
            </div>
          </div>

          {/* Right Panel - Results */}
          <div>
            {!auditResults ? (
              <Card className="glass-effect border-border p-8 h-full flex items-center justify-center min-h-96">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                  <p className="text-foreground/60">Run an audit to see results</p>
                </div>
              </Card>
            ) : (
              <AuditResults results={auditResults} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}