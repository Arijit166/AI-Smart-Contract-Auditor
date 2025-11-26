"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import CodeEditor from "@/components/code-editor"
import AuditResults from "@/components/audit-results"
import { Upload, FileText, AlertCircle } from "lucide-react"

export default function AuditPage() {
  const [code, setCode] = useState("")
  const [isAuditing, setIsAuditing] = useState(false)
  const [auditResults, setAuditResults] = useState(null)
  const [fileUploaded, setFileUploaded] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith(".sol")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setCode(event.target?.result as string)
        setFileUploaded(true)
      }
      reader.readAsText(file)
    }
  }

  const handleRunAudit = async () => {
    setIsAuditing(true)
    // Simulate AI audit
    setTimeout(() => {
      setAuditResults({
        riskScore: 72,
        vulnerabilities: [
          {
            id: 1,
            severity: "high",
            title: "Unchecked Call Return Value",
            line: 45,
            description: "The return value of external call is not checked",
          },
          {
            id: 2,
            severity: "medium",
            title: "State Variable Shadowing",
            line: 28,
            description: "Variable shadows a state variable from parent contract",
          },
          {
            id: 3,
            severity: "low",
            title: "Missing Event Log",
            line: 62,
            description: "No event emitted for critical state change",
          },
        ],
        suggestions: [
          "Add require() checks for external calls",
          "Implement access control modifiers",
          "Use SafeMath library for arithmetic operations",
        ],
      })
      setIsAuditing(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Upload & Code Editor */}
          <div className="space-y-6">
            {/* File Upload Box */}
            <Card
              className="glass-effect border-border hover:border-primary/50 transition-all p-8 text-center cursor-pointer group"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
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
