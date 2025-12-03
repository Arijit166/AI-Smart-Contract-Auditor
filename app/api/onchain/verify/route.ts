import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const REGISTRY_ABI = [
  "function getAudit(address contractAddress) public view returns (tuple(bytes32 originalCodeHash, bytes32 fixedCodeHash, uint256 riskScore, string ipfsPdfCID, string ipfsCodeCID, uint256 timestamp, address auditor, bool exists))",
  "function isAudited(address contractAddress) public view returns (bool)"
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network');
    const contractAddress = searchParams.get('contractAddress');

    if (!network || !contractAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing network or contractAddress' },
        { status: 400 }
      );
    }

    // Validate address
    if (!ethers.isAddress(contractAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contract address' },
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

    // Initialize provider
    const provider = new ethers.JsonRpcProvider(networkConfig.rpc);

    // Initialize Registry contract
    const registryContract = new ethers.Contract(
      networkConfig.registryContract,
      REGISTRY_ABI,
      provider
    );

    // Check if audited
    const isAudited = await registryContract.isAudited(contractAddress);

    if (!isAudited) {
      return NextResponse.json({
        success: true,
        isAudited: false,
        message: 'No audit found for this contract',
      });
    }

    // Get audit details
    const audit = await registryContract.getAudit(contractAddress);

    return NextResponse.json({
      success: true,
      isAudited: true,
      audit: {
        originalCodeHash: audit.originalCodeHash,
        fixedCodeHash: audit.fixedCodeHash,
        riskScore: Number(audit.riskScore),
        merkleRoot: audit.merkleRoot,
        merkleLeaves: audit.merkleLeaves || null,
        ipfsPdfCID: audit.ipfsPdfCID,
        ipfsCodeCID: audit.ipfsCodeCID,
        timestamp: Number(audit.timestamp),
        auditor: audit.auditor,
        ipfsLinks: {
          pdf: `https://gateway.pinata.cloud/ipfs/${audit.ipfsPdfCID}`,
          code: `https://gateway.pinata.cloud/ipfs/${audit.ipfsCodeCID}`,
        },
      },
      network,
    });
  } catch (error: any) {
    console.error('❌ Verify audit error:', error);
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