import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'

const NETWORK_CONFIG: Record<string, { rpc: string, registryAddress: string }> = {
  'polygon-amoy': {
    rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || '',
    registryAddress: process.env.NEXT_PUBLIC_VULNERABILITY_REGISTRY_POLYGON_AMOY || '',
  },
  'flow-testnet': {
    rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC_URL || '',
    registryAddress: process.env.NEXT_PUBLIC_VULNERABILITY_REGISTRY_FLOW_TESTNET || '',
  },
  'celo-sepolia': {
    rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || '',
    registryAddress: process.env.NEXT_PUBLIC_VULNERABILITY_REGISTRY_CELO_SEPOLIA || '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const network = searchParams.get('network') || 'polygon-amoy'
    
    const config = NETWORK_CONFIG[network]
    if (!config || !config.registryAddress) {
      return NextResponse.json({ success: false, error: 'Registry not configured' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // ✅ Fetch audits registered on-chain for this specific network
    const audits = await db.collection(AuditCollection)
      .find({ 
        registeredOnChain: true,
        registryNetwork: network 
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    // Transform to match RegistryAudit interface
    const registryAudits = audits.map(audit => ({
      auditId: audit._id.toString(),
      contractHash: audit.contractHash || '',
      merkleRoot: audit.merkleRoot || null,
      auditor: audit.userId,
      timestamp: Math.floor(new Date(audit.createdAt).getTime() / 1000),
      riskScore: audit.riskScore,
      totalVulnerabilities: audit.vulnerabilities?.length || 0,
      summary: {
        critical: audit.vulnerabilities?.filter((v: any) => v.severity === 'critical').length || 0,
        high: audit.vulnerabilities?.filter((v: any) => v.severity === 'high').length || 0,
        medium: audit.vulnerabilities?.filter((v: any) => v.severity === 'medium').length || 0,
        low: audit.vulnerabilities?.filter((v: any) => v.severity === 'low').length || 0,
      },
      ipfsReportCID: audit.ipfsMetadataCID || '',
      network: audit.registryNetwork || network
    }))

    return NextResponse.json({ success: true, audits: registryAudits })
  } catch (error: any) {
    console.error('Registry list error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}