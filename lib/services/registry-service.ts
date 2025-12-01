import { ethers } from 'ethers'

const REGISTRY_ABI = [
  "function registerAudit(bytes32 auditId, bytes32 contractHash, bytes32 fixedCodeHash, bytes32 llmOutputHash, address auditorAddress, uint8 riskScore, bool autoFixApplied, tuple(uint16 critical, uint16 high, uint16 medium, uint16 low) summary, string ipfsReportCID, string ipfsFixedCodeCID, uint256 networkId, tuple(string vulnType, uint8 severity, bytes32 descriptionHash, uint32 lineNumber, bool fixed, bytes32 fixHash)[] vulnDetails) returns (bool)",
  "function isContractAudited(bytes32 contractHash) view returns (bool)",
  "function getAudit(bytes32 contractHash) view returns (tuple(bytes32 auditId, bytes32 contractHash, bytes32 fixedCodeHash, bytes32 llmOutputHash, address auditorAddress, uint256 timestamp, uint8 riskScore, bool autoFixApplied, uint16 totalVulnerabilities, tuple(uint16 critical, uint16 high, uint16 medium, uint16 low) summary, string ipfsReportCID, string ipfsFixedCodeCID, uint256 networkId, bool exists))",
  "function getAuditById(bytes32 auditId) view returns (tuple(bytes32 auditId, bytes32 contractHash, bytes32 fixedCodeHash, bytes32 llmOutputHash, address auditorAddress, uint256 timestamp, uint8 riskScore, bool autoFixApplied, uint16 totalVulnerabilities, tuple(uint16 critical, uint16 high, uint16 medium, uint16 low) summary, string ipfsReportCID, string ipfsFixedCodeCID, uint256 networkId, bool exists))",
  "function getVulnerabilities(bytes32 contractHash) view returns (bytes32[])",
  "function getVulnerabilityDetail(bytes32 vulnId) view returns (tuple(string vulnType, uint8 severity, bytes32 descriptionHash, uint32 lineNumber, bool fixed, bytes32 fixHash))",
  "function getAuditorAudits(address auditor) view returns (bytes32[])"
]

const NETWORK_CONFIG: Record<string, { rpc: string, registryAddress: string, chainId: number }> = {
  'polygon-amoy': {
    rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/',
    registryAddress: process.env.NEXT_PUBLIC_VULNERABILITY_REGISTRY_POLYGON_AMOY || '',
    chainId: 80002
  },
  'flow-testnet': {
    rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
    registryAddress: process.env.NEXT_PUBLIC_VULNERABILITY_REGISTRY_FLOW_TESTNET || '',
    chainId: 545
  },
  'celo-sepolia': {
    rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
    registryAddress: process.env.NEXT_PUBLIC_VULNERABILITY_REGISTRY_CELO_SEPOLIA || '',
    chainId: 44787
  }
}

export async function registerAuditOnChain(
  network: string,
  auditData: {
    auditId: string
    contractCode: string
    fixedCode: string
    llmOutput: string
    auditorAddress: string
    riskScore: number
    autoFixApplied: boolean
    vulnerabilities: Array<{
      severity: string
      title: string
      line: number
      description: string
      fixed: boolean
    }>
    ipfsReportCID: string
    ipfsFixedCodeCID: string
  }
) {
  try {
    const config = NETWORK_CONFIG[network]
    if (!config || !config.registryAddress) {
      throw new Error(`Registry not configured for ${network}`)
    }

    const provider = new ethers.JsonRpcProvider(config.rpc)
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider)
    const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, wallet)

    // Generate hashes
    const auditIdHash = ethers.id(auditData.auditId)
    const contractHash = ethers.keccak256(ethers.toUtf8Bytes(auditData.contractCode))
    const fixedCodeHash = ethers.keccak256(ethers.toUtf8Bytes(auditData.fixedCode))
    const llmOutputHash = ethers.keccak256(ethers.toUtf8Bytes(auditData.llmOutput))

    // Count vulnerabilities by severity
    const summary = {
      critical: auditData.vulnerabilities.filter(v => v.severity === 'critical').length,
      high: auditData.vulnerabilities.filter(v => v.severity === 'high').length,
      medium: auditData.vulnerabilities.filter(v => v.severity === 'medium').length,
      low: auditData.vulnerabilities.filter(v => v.severity === 'low').length
    }

    // Format vulnerability details
    const vulnDetails = auditData.vulnerabilities.map(v => ({
      vulnType: v.title,
      severity: v.severity === 'critical' ? 3 : v.severity === 'high' ? 2 : v.severity === 'medium' ? 1 : 0,
      descriptionHash: ethers.keccak256(ethers.toUtf8Bytes(v.description)),
      lineNumber: v.line,
      fixed: v.fixed,
      fixHash: v.fixed ? ethers.keccak256(ethers.toUtf8Bytes(`fix-${v.line}`)) : ethers.ZeroHash
    }))

    console.log('📝 Registering audit on-chain...')
    const tx = await registry.registerAudit(
      auditIdHash,
      contractHash,
      fixedCodeHash,
      llmOutputHash,
      auditData.auditorAddress,
      auditData.riskScore,
      auditData.autoFixApplied,
      summary,
      auditData.ipfsReportCID,
      auditData.ipfsFixedCodeCID,
      config.chainId,
      vulnDetails
    )

    console.log('⏳ Waiting for confirmation...')
    const receipt = await tx.wait()

    return {
      success: true,
      transactionHash: receipt.hash,
      contractHash,
      auditIdHash
    }
  } catch (error: any) {
    console.error('Registry registration error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export async function checkContractAudited(network: string, contractCode: string) {
  try {
    const config = NETWORK_CONFIG[network]
    if (!config || !config.registryAddress) {
      return { audited: false }
    }

    const provider = new ethers.JsonRpcProvider(config.rpc)
    const registry = new ethers.Contract(config.registryAddress, REGISTRY_ABI, provider)

    const contractHash = ethers.keccak256(ethers.toUtf8Bytes(contractCode))
    const audited = await registry.isContractAudited(contractHash)

    if (audited) {
      const auditData = await registry.getAudit(contractHash)
      return {
        audited: true,
        audit: {
          auditId: auditData.auditId,
          auditor: auditData.auditorAddress,
          timestamp: Number(auditData.timestamp),
          riskScore: auditData.riskScore,
          totalVulnerabilities: auditData.totalVulnerabilities,
          summary: auditData.summary,
          ipfsReportCID: auditData.ipfsReportCID
        }
      }
    }

    return { audited: false }
  } catch (error: any) {
    console.error('Check audit error:', error)
    return { audited: false, error: error.message }
  }
}