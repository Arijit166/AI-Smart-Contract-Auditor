import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import MerkleAuditProofJSON from '@/contracts/contracts/abis/MerkleAuditProof.json'

export async function POST(req: NextRequest) {
  try {
    const { auditId, merkleRoot, auditor, network } = await req.json()

    if (!auditId || !merkleRoot || !auditor || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const networkConfig = getNetworkConfig(network)
    
    if (!networkConfig || !networkConfig.merkleContract) {
      return NextResponse.json({ success: false, error: 'Contract not deployed on this network' }, { status: 400 })
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY

    if (!networkConfig.rpc || !privateKey) {
      return NextResponse.json({ success: false, error: 'Network configuration missing' }, { status: 500 })
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpc)
    const wallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(networkConfig.merkleContract, MerkleAuditProofJSON.abi, wallet)

    const tx = await contract.storeAuditProof(auditor, merkleRoot, auditId)
    const receipt = await tx.wait()

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      merkleRoot,
      contractAddress: networkConfig.merkleContract
    })
  } catch (error: any) {
    console.error('Store on-chain error:', error)
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
      rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
      merkleContract: process.env.NEXT_PUBLIC_MERKLE_PROOF_CELO_SEPOLIA,
    },
  }

  return configs[network]
}