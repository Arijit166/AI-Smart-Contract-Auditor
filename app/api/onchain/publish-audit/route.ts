import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const REGISTRY_ABI = [
  "function publishAudit(address contractAddress, bytes32 originalCodeHash, bytes32 fixedCodeHash, uint256 riskScore, string memory ipfsPdfCID, string memory ipfsCodeCID) public",
  "event AuditPublished(address indexed contractAddress, address indexed auditor, bytes32 originalCodeHash, bytes32 fixedCodeHash, uint256 riskScore, string ipfsPdfCID, string ipfsCodeCID, uint256 timestamp)"
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      network,
      contractAddress,
      originalCodeHash,
      fixedCodeHash,
      riskScore,
      ipfsPdfCID,
      ipfsCodeCID,
    } = body;

    // Validate inputs
    if (!network || !contractAddress || !originalCodeHash || !fixedCodeHash || riskScore === undefined || !ipfsPdfCID || !ipfsCodeCID) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get network configuration
    const networkConfig = getNetworkConfig(network);
    if (!networkConfig) {
      return NextResponse.json(
        { success: false, error: 'Unsupported network' },
        { status: 400 }
      );
    }

    // Initialize provider and signer
    const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
    const signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

    // Initialize Registry contract
    const registryContract = new ethers.Contract(
      networkConfig.registryContract,
      REGISTRY_ABI,
      signer
    );

    // Publish audit
    const tx = await registryContract.publishAudit(
      contractAddress,
      originalCodeHash,
      fixedCodeHash,
      riskScore,
      ipfsPdfCID,
      ipfsCodeCID
    );

    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      transactionHash: receipt.hash,
      registryContract: networkConfig.registryContract,
      network,
    });
  } catch (error: any) {
    console.error('❌ Publish audit error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getNetworkConfig(network: string) {
  const configs: Record<string, any> = {
    'polygon-amoy': {
      rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || 'https://rpc-amoy.polygon.technology/',
      registryContract: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_POLYGON_AMOY,
    },
    'flow-testnet': {
      rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC || 'https://testnet.evm.nodes.onflow.org',
      registryContract: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_FLOW_TESTNET,
    },
    'celo-sepolia': {
      rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC || 'https://forno.celo-sepolia.celo-testnet.org/',
      registryContract: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_CELO_SEPOLIA,
    },
  };

  return configs[network];
}