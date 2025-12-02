import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import MerkleAuditProofJSON from '@/contracts/contracts/abis/MerkleAuditProof.json'

export async function POST(req: NextRequest) {
  try {
    const { auditId, leaf, merkleProof, network } = await req.json()

    if (!auditId || !leaf || !merkleProof || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const contractAddress = process.env[`NEXT_PUBLIC_MERKLE_PROOF_${network.toUpperCase().replace('-', '_')}`]
    
    if (!contractAddress) {
      return NextResponse.json({ success: false, error: 'Contract not deployed on this network' }, { status: 400 })
    }

    const rpcUrl = process.env[`${network.toUpperCase().replace('-', '_')}_RPC_URL`]
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(contractAddress, MerkleAuditProofJSON.abi, provider)

    // Call the view function - it returns boolean directly
    const isValid = await contract.verifyLeaf(auditId, leaf, merkleProof)

    return NextResponse.json({
      success: true,
      isValid,
      transactionHash: 'View function call'
    })
  } catch (error: any) {
    console.error('Verify error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}