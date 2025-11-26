import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ClientLayout from "@/app/client-layout"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <title>AI Smart Contract Auditor</title>
        <meta name="description" content="Upload, audit, and deploy secure smart contracts" />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
