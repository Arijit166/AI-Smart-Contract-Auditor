"use client"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  return (
    <div className="glass-effect border border-border rounded-lg overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="// Paste your Solidity code here
pragma solidity ^0.8.0;

contract MyContract {
  // Your code...
}"
        className="w-full h-64 bg-input border-0 text-foreground font-mono text-sm p-4 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      />
    </div>
  )
}
