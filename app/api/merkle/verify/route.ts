import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import MerkleAuditProofJSON from '@/contracts/contracts/abis/MerkleAuditProof.json'

export async function POST(req: NextRequest) {
  try {
    const { auditId, leaf, merkleProof, network } = await req.json()
    
    if (!auditId || !leaf || !merkleProof || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }
    
    const networkConfig = getNetworkConfig(network)
    
    if (!networkConfig || !networkConfig.merkleContract) {
      return NextResponse.json({ success: false, error: 'Contract not deployed on this network' }, { status: 400 })
    }
    
    const provider = new ethers.JsonRpcProvider(networkConfig.rpc)
    const contract = new ethers.Contract(networkConfig.merkleContract, MerkleAuditProofJSON.abi, provider)
    
    // Call the view function - it returns boolean directly
    const isValid = await contract.checkLeafValidity(auditId, leaf, merkleProof)
    
    return NextResponse.json({
      success: true,
      isValid,
      transactionHash: 'View function call - no transaction'
    })
  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function getNetworkConfig(network: string) {
  const configs: Record<string, any> = {
    'polygon-amoy': {
      rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/',
      merkleContract: process.env.NEXT_PUBLIC_MERKLE_PROOF_POLYGON_AMOY,
    },
    'flow-testnet': {
      rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
      merkleContract: process.env.NEXT_PUBLIC_MERKLE_PROOF_FLOW_TESTNET,
    },
    'celo-sepolia': {
      rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org/',
      merkleContract: process.env.NEXT_PUBLIC_MERKLE_PROOF_CELO_SEPOLIA,
    },
  }
  return configs[network]
}