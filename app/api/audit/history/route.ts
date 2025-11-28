import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db'
import { AuditCollection } from '@/lib/models/Audit'
import { DeploymentCollection } from '@/lib/models/Deployment'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json(
        { error: 'User address required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const auditsCollection = db.collection(AuditCollection)
    const deploymentsCollection = db.collection(DeploymentCollection)

    // Get all audits
    const audits = await auditsCollection
      .find({ userId: userAddress })
      .sort({ createdAt: -1 })
      .toArray()

    // Get all deployments
    const deployments = await deploymentsCollection
      .find({ userAddress })
      .sort({ createdAt: -1 })
      .toArray()

    // Create a map of contract code to deployment info
    const deploymentMap = new Map()
    deployments.forEach(dep => {
      deploymentMap.set(dep.contractCode, {
        address: dep.contractAddress,
        network: dep.network,
        transactionHash: dep.deploymentHash,
        gasUsed: dep.gasUsed,
        deployedAt: dep.createdAt
      })
    })

    // Enrich audits with deployment info
    const enrichedAudits = audits.map(audit => {
      const deployment = deploymentMap.get(audit.contractCode)
      
      return {
        id: audit._id.toString(),
        name: `${audit.contractName}.sol`,
        date: audit.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: deployment ? 'Deployed' : 'Audited',
        riskScore: audit.riskScore,
        vulnerabilities: audit.vulnerabilities.length,
        address: deployment?.address || null,
        network: deployment?.network || null,
        transactionHash: deployment?.transactionHash || null,
        gasUsed: deployment?.gasUsed || null,
      }
    })

    // Add standalone deployments (deployments without audits)
    const auditContractCodes = new Set(audits.map(a => a.contractCode))
    const standaloneDeployments = deployments
      .filter(dep => !auditContractCodes.has(dep.contractCode))
      .map(dep => ({
        id: dep._id.toString(),
        name: `${dep.contractName}.sol`,
        date: dep.createdAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        status: 'Deployed',
        riskScore: 0, // No audit data
        vulnerabilities: 0,
        address: dep.contractAddress,
        network: dep.network,
        transactionHash: dep.deploymentHash,
        gasUsed: dep.gasUsed,
      }))

    // Combine and sort by date
    const allItems = [...enrichedAudits, ...standaloneDeployments].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return NextResponse.json({
      success: true,
      audits: allItems, 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}