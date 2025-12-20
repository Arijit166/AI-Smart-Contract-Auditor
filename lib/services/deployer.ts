import { ethers } from 'ethers'

interface NetworkConfig {
  rpc: string
  name: string
  chainId: number
}

const networks: Record<string, NetworkConfig> = {
  'polygon-amoy': {
    rpc: process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC || '',
    name: 'Polygon Amoy',
    chainId: 80002,
  },
  'flow-testnet': {
    rpc: process.env.NEXT_PUBLIC_FLOW_TESTNET_RPC || 'https://testnet.evm.nodes.onflow.org',
    name: 'Flow Testnet',
    chainId: 545,
  },
  'celo-sepolia': {
    rpc: process.env.NEXT_PUBLIC_CELO_SEPOLIA_RPC || 'https://forno.celo-sepolia.celo-testnet.org',
    name: 'Celo sepolia',
    chainId: 11142220
,
  },
}

interface CompilationPayload {
  contractCode: string
  network: string
}

interface CompilationResponse {
  success: boolean
  bytecode?: string
  abi?: any[]
  error?: string
}

export async function compileContract(payload: CompilationPayload): Promise<CompilationResponse> {
  try {
    console.log('🔵 [Compile] Sending to Python backend...')
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/compile`,  {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: payload.contractCode,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ [Compile] Backend error:', data.error)
      return {
        success: false,
        error: data.error || 'Compilation failed',
      }
    }

    console.log('✅ [Compile] Success')
    return {
      success: true,
      bytecode: data.bytecode,
      abi: data.abi,
    }
  } catch (error: any) {
    console.error('❌ [Compile] Error:', error.message)
    return {
      success: false,
      error: error.message || 'Compilation failed',
    }
  }
}

export function getNetworkConfig(network: string): NetworkConfig | null {
  return networks[network] || null
}

export function isValidNetwork(network: string): boolean {
  return network in networks
}