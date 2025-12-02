import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import MerkleAuditProofJSON from '@/contracts/contracts/abis/MerkleAuditProof.json'

export async function POST(req: NextRequest) {
  try {
    const { auditId, merkleRoot, auditor, network } = await req.json()

    if (!auditId || !merkleRoot || !auditor || !network) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const contractAddress = process.env[`NEXT_PUBLIC_MERKLE_PROOF_${network.toUpperCase().replace('-', '_')}`]
    
    if (!contractAddress) {
      return NextResponse.json({ success: false, error: 'Contract not deployed on this network' }, { status: 400 })
    }

    const rpcUrl = process.env[`${network.toUpperCase().replace('-', '_')}_RPC_URL`]
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY

    if (!rpcUrl || !privateKey) {
      return NextResponse.json({ success: false, error: 'Network configuration missing' }, { status: 500 })
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)
    const contract = new ethers.Contract(contractAddress, MerkleAuditProofJSON.abi, wallet)

    const tx = await contract.storeAuditProof(auditor, merkleRoot, auditId)
    const receipt = await tx.wait()

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      merkleRoot,
      contractAddress
    })
  } catch (error: any) {
    console.error('Store on-chain error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}