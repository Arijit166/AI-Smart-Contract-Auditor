import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { ipfsService } from '@/lib/services/ipfs';
import { generateAuditPDF } from '@/lib/services/pdfGenerator';

const NFT_ABI = [
  "function mintCertificate(address to, bytes32 originalCodeHash, bytes32 fixedCodeHash, uint256 riskScore, string memory ipfsMetadataCID) public returns (uint256)",
  "event CertificateMinted(uint256 indexed tokenId, address indexed auditor, bytes32 originalCodeHash, bytes32 fixedCodeHash, uint256 riskScore, string ipfsMetadataCID)"
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      network, 
      userAddress, 
      originalCode, 
      fixedCode, 
      auditData 
    } = body;

    // Validate inputs
    if (!network || !userAddress || !originalCode || !fixedCode || !auditData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate PDF report
    const pdfBuffer = await generateAuditPDF(auditData);

    // Calculate code hashes
    const originalCodeHash = ethers.keccak256(ethers.toUtf8Bytes(originalCode));
    const fixedCodeHash = ethers.keccak256(ethers.toUtf8Bytes(fixedCode));

    // Upload to IPFS
    const ipfsResult = await ipfsService.uploadAuditPackage(
      originalCode,
      fixedCode,
      pdfBuffer,
      {
        originalCodeHash,
        fixedCodeHash,
        riskScore: auditData.riskScore,
        auditor: userAddress,
        vulnerabilities: auditData.vulnerabilities?.length || 0,
      }
    );

    if (!ipfsResult.success) {
      return NextResponse.json(
        { success: false, error: ipfsResult.error },
        { status: 500 }
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

    // Initialize NFT contract
    const nftContract = new ethers.Contract(
      networkConfig.nftContract,
      NFT_ABI,
      signer
    );

    // Mint NFT
    const tx = await nftContract.mintCertificate(
      userAddress,
      originalCodeHash,
      fixedCodeHash,
      auditData.riskScore,
      ipfsResult.metadataCID
    );

    const receipt = await tx.wait(1);

    // Parse event to get token ID
    const event = receipt.logs.find((log: any) => {
      try {
        return nftContract.interface.parseLog(log)?.name === 'CertificateMinted';
      } catch {
        return false;
      }
    });

    let tokenId = null;
    if (event) {
      const parsed = nftContract.interface.parseLog(event);
      tokenId = parsed?.args?.tokenId?.toString();
    }

    return NextResponse.json({
      success: true,
      tokenId,
      transactionHash: receipt.hash,
      ipfs: {
        originalCodeCID: ipfsResult.originalCodeCID,
        fixedCodeCID: ipfsResult.fixedCodeCID,
        pdfCID: ipfsResult.pdfCID,
        metadataCID: ipfsResult.metadataCID,
      },
      nftContract: networkConfig.nftContract,
      network,
    });
  } catch (error: any) {
    console.error('❌ Mint certificate error:', error);
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
      nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_POLYGON_AMOY,
      registryContract: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_POLYGON_AMOY,
    },
    'flow-testnet': {
      rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC || 'https://testnet.evm.nodes.onflow.org',
      nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_FLOW_TESTNET,
      registryContract: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_FLOW_TESTNET,
    },
    'celo-sepolia': {
      rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC || 'https://alfajores-forno.celo-testnet.org',
      nftContract: process.env.NEXT_PUBLIC_NFT_CONTRACT_CELO_SEPOLIA,
      registryContract: process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_CELO_SEPOLIA,
    },
  };

  return configs[network];
}